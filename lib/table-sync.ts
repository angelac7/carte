import type { TableAllergyEntry } from "@/lib/table-allergies";
export type TableSyncStatus = "saving" | "synced" | "offline" | "failed";
type TableAllergies = Record<string, TableAllergyEntry>;
type Lines = Record<string, number>;
type Snapshot = { lines: Lines; allergies: TableAllergies };
type AllergyWrite = { person: string; entry: TableAllergyEntry | null };

/** One ordered write stream per table. Pending intent survives failures and masks stale reads. */
export class TableSync {
  private lines = new Map<string, number>();
  private allergy: AllergyWrite | undefined;
  private running: Promise<void> | null = null;
  private active = true;
  private reading = false;
  private epoch = 0;
  private stoppedSharing = false;
  constructor(
    private io: {
      read: () => Promise<Snapshot>;
      line: (line: string, quantity: number) => Promise<Lines>;
      allergies: (person: string, entry: TableAllergyEntry | null) => Promise<TableAllergies>;
      showLines: (lines: Lines) => void;
      showAllergies: (allergies: TableAllergies) => void;
      status: (status: TableSyncStatus) => void;
      online: () => boolean;
      error: (error: unknown) => void;
    },
  ) {}
  stop() {
    this.active = false;
  }
  private overlay(lines: Lines) {
    const result = { ...lines };
    for (const [key, quantity] of this.lines) {
      if (quantity) result[key] = quantity;
      else delete result[key];
    }
    return result;
  }
  quantity(line: string, quantity: number) {
    this.lines.set(line, quantity);
    this.epoch++;
    void this.flush().catch(() => {});
  }
  share(person: string, entry: TableAllergyEntry | null, automatic = false): Promise<void> {
    if (automatic && this.stoppedSharing) return Promise.resolve();
    if (!automatic) this.stoppedSharing = entry === null;
    if (JSON.stringify(this.allergy) !== JSON.stringify({ person, entry })) {
      this.allergy = { person, entry };
      this.epoch++;
    }
    return this.flush();
  }
  async refresh() {
    if (!this.active || this.reading) return;
    if (!this.io.online()) {
      this.io.status("offline");
      return;
    }
    this.reading = true;
    try {
      await this.flush();
      const epoch = this.epoch;
      const snapshot = await this.io.read();
      if (!this.active || epoch !== this.epoch || this.running) return;
      this.io.showLines(this.overlay(snapshot.lines));
      this.io.showAllergies(snapshot.allergies);
      this.io.status("synced");
    } catch (error) {
      this.failed(error);
    } finally {
      this.reading = false;
    }
  }
  private failed(error: unknown) {
    if (!this.active) return;
    this.io.status(this.io.online() ? "failed" : "offline");
    this.io.error(error);
  }
  flush(): Promise<void> {
    if (!this.active) return Promise.resolve();
    if (this.running) return this.running;
    if (!this.lines.size && !this.allergy) return Promise.resolve();
    if (!this.io.online()) {
      this.io.status("offline");
      return Promise.reject(new Error("Offline"));
    }
    this.io.status("saving");
    // Defer execution so running is set even if the transport throws synchronously.
    this.running = Promise.resolve()
      .then(async () => {
        while (this.active && (this.lines.size || this.allergy)) {
          if (this.allergy) {
            const intent = this.allergy;
            const all = await this.io.allergies(intent.person, intent.entry);
            if (!this.active) return;
            if (this.allergy === intent) {
              this.allergy = undefined;
              this.io.showAllergies(all);
            }
          } else {
            const [line, quantity] = this.lines.entries().next().value!;
            const saved = await this.io.line(line, quantity);
            if (!this.active) return;
            if (this.lines.get(line) === quantity) this.lines.delete(line);
            this.io.showLines(this.overlay(saved));
          }
        }
        if (this.active) this.io.status("synced");
      })
      .catch((error) => {
        this.failed(error);
        throw error;
      })
      .finally(() => {
        this.running = null;
      });
    return this.running;
  }
}
