import type { TableAllergyEntry } from "@/lib/table-allergies";
export type TableSyncStatus = "saving" | "synced" | "offline" | "failed";
type TableAllergies = Record<string, TableAllergyEntry>;
type Lines = Record<string, number>;
type Snapshot = { lines: Lines; allergies: TableAllergies };
type AllergyWrite = { person: string; entry: TableAllergyEntry | null };
/** A change to one line, by how much. Its id lets the table recognize a retry. */
type Change = { line: string; by: number; id: string };

const MAX_QUANTITY = 20;

/** The table turned a change down for good, like adding a dish the kitchen just took off. */
export class TableChangeRejectedError extends Error {}

/**
 * One ordered write stream per table. Taps are sent as how much they changed a line, so two
 * phones adding the same dish at once both count. Pending changes survive failures and are shown
 * on top of the table's order, so a read from before a tap never hides it.
 */
export class TableSync {
  // The table's order as the table last reported it.
  private table: Lines;
  // Changes not sent yet, added up by line.
  private waiting = new Map<string, number>();
  // A change sent but not confirmed; after a failure it's sent again with the same id.
  private sending: Change | null = null;
  private allergy: AllergyWrite | undefined;
  private running: Promise<void> | null = null;
  private active = true;
  private reading = false;
  private epoch = 0;
  private stoppedSharing = false;
  constructor(
    private io: {
      read: () => Promise<Snapshot>;
      change: (line: string, by: number, id: string) => Promise<Lines>;
      newId: () => string;
      allergies: (person: string, entry: TableAllergyEntry | null) => Promise<TableAllergies>;
      showLines: (lines: Lines) => void;
      showAllergies: (allergies: TableAllergies) => void;
      status: (status: TableSyncStatus) => void;
      online: () => boolean;
      error: (error: unknown) => void;
    },
    /** The order the table started with, until the first read. */
    table: Lines = {},
  ) {
    this.table = { ...table };
  }
  stop() {
    this.active = false;
  }
  /** What this phone shows: the table's order plus this phone's changes on their way. */
  private shown(): Lines {
    const shown = { ...this.table };
    const apply = (line: string, by: number) => {
      const quantity = Math.min(MAX_QUANTITY, Math.max(0, (shown[line] ?? 0) + by));
      if (quantity) shown[line] = quantity;
      else delete shown[line];
    };
    if (this.sending) apply(this.sending.line, this.sending.by);
    for (const [line, by] of this.waiting) apply(line, by);
    return shown;
  }
  /** Sets a line to the quantity the diner chose, sent as the difference from what they saw. */
  quantity(line: string, quantity: number) {
    const target = Math.min(MAX_QUANTITY, Math.max(0, quantity));
    const by = target - (this.shown()[line] ?? 0);
    if (!by) return;
    const total = (this.waiting.get(line) ?? 0) + by;
    if (total) this.waiting.set(line, total);
    else this.waiting.delete(line);
    this.epoch++;
    this.io.showLines(this.shown());
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
      this.table = snapshot.lines;
      this.io.showLines(this.shown());
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
  private hasWrites() {
    return !!this.sending || this.waiting.size > 0 || !!this.allergy;
  }
  flush(): Promise<void> {
    if (!this.active) return Promise.resolve();
    if (this.running) return this.running;
    if (!this.hasWrites()) return Promise.resolve();
    if (!this.io.online()) {
      this.io.status("offline");
      return Promise.reject(new Error("Offline"));
    }
    this.io.status("saving");
    // Defer execution so running is set even if the transport throws synchronously.
    this.running = Promise.resolve()
      .then(async () => {
        while (this.active && this.hasWrites()) {
          if (this.allergy) {
            const intent = this.allergy;
            const all = await this.io.allergies(intent.person, intent.entry).catch((error) => {
              // Retrying a change the table turned down would hold up every change after it.
              if (error instanceof TableChangeRejectedError && this.allergy === intent)
                this.allergy = undefined;
              throw error;
            });
            if (!this.active) return;
            if (this.allergy === intent) {
              this.allergy = undefined;
              this.io.showAllergies(all);
            }
          } else {
            if (!this.sending) {
              const [line, by] = this.waiting.entries().next().value!;
              this.waiting.delete(line);
              this.sending = { line, by, id: this.io.newId() };
            }
            const { line, by, id } = this.sending;
            // A change the table turns down is dropped, not retried forever ahead of later ones;
            // the next read shows what the table really has.
            const table = await this.io.change(line, by, id).catch((error) => {
              if (error instanceof TableChangeRejectedError) return null;
              throw error;
            });
            if (!this.active) return;
            this.sending = null;
            if (table) this.table = table;
            this.io.showLines(this.shown());
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
