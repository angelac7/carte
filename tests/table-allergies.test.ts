import { describe, expect, it } from "vitest";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { LANGUAGES } from "@/lib/languages";
import {
  hasAllergies,
  isPersonId,
  newPersonId,
  sameAllergies,
  tableAllergyRows,
  type TableAllergyEntry,
} from "@/lib/table-allergies";
import { createTestDatabase } from "./helpers/test-database";

const entry = (overrides: Partial<TableAllergyEntry> = {}): TableAllergyEntry => ({
  label: "",
  avoid: [],
  alsoAvoid: [],
  severity: "allergy",
  ...overrides,
});

describe("table allergies", () => {
  it("gives each phone a random id at the table", () => {
    const id = newPersonId(new Uint8Array([0, 1, 2, 31, 32, 255, 7, 8, 9, 10, 11, 12]));
    expect(isPersonId(id)).toBe(true);
    expect(id).toHaveLength(12);
    expect(isPersonId("short")).toBe(false);
    expect(isPersonId("ABCDEFGHJKMN")).toBe(false);
  });

  it("notices when the diner's settings differ from what they shared", () => {
    const shared = entry({ avoid: ["milk", "eggs"], alsoAvoid: ["pork"] });
    expect(sameAllergies(shared, entry({ avoid: ["eggs", "milk"], alsoAvoid: ["pork"] }))).toBe(
      true,
    );
    expect(sameAllergies(shared, { ...shared, severity: "severe" })).toBe(false);
    expect(sameAllergies(shared, { ...shared, alsoAvoid: [] })).toBe(false);
    expect(hasAllergies(entry())).toBe(false);
    expect(hasAllergies(entry({ alsoAvoid: ["alcohol"] }))).toBe(true);
  });

  it("lists this phone first, and numbers people without a name", () => {
    const rows = tableAllergyRows(
      {
        zzzzzzzzzzzz: entry({ label: "Mia" }),
        aaaaaaaaaaaa: entry(),
        mmmmmmmmmmmm: entry({ label: "  " }),
      },
      "zzzzzzzzzzzz",
      (n) => `Guest ${n}`,
    );
    expect(rows.map((row) => [row.name, row.mine])).toEqual([
      ["Mia", true],
      ["Guest 1", false],
      ["Guest 2", false],
    ]);
  });

  it("has every word it needs in every language", () => {
    for (const { code } of LANGUAGES) {
      const t = TABLE_STRINGS[code];
      expect(
        t.tableAllergiesTitle && t.tableAllergiesHint && t.shareMine && t.stopSharingMine,
      ).toBeTruthy();
      expect(t.tableAllergiesNone("Filters")).toContain("Filters");
      expect(t.guest(3)).toContain("3");
    }
  });

  it("are kept with the shared order, limited in size, and removed on request", async () => {
    const db = await createTestDatabase();
    try {
      await db.exec(`
        insert into auth.users values ('00000000-0000-0000-0000-00000000000a');
        insert into public.restaurants (owner_id, name, slug)
          values ('00000000-0000-0000-0000-00000000000a', 'Cafe', 'cafe');
        select public.create_shared_order((select id from public.restaurants), 'abcdefgh23', '{}');
      `);
      const set = async (person: string, value: unknown) =>
        (
          await db.query<{ all: Record<string, unknown> | null }>(
            `select public.set_shared_allergies('abcdefgh23', $1, $2::jsonb) as all`,
            [person, value === null ? null : JSON.stringify(value)],
          )
        ).rows[0].all;
      const mia = { label: "Mia", avoid: ["peanuts"], alsoAvoid: [], severity: "severe" };
      expect(await set("aaaaaaaaaaaa", mia)).toEqual({ aaaaaaaaaaaa: mia });
      await set("bbbbbbbbbbbb", {
        label: "",
        avoid: ["milk"],
        alsoAvoid: ["pork"],
        severity: "allergy",
      });
      const { rows } = await db.query<{ allergies: Record<string, unknown> }>(
        "select allergies from public.get_shared_order('abcdefgh23')",
      );
      expect(Object.keys(rows[0].allergies).sort()).toEqual(["aaaaaaaaaaaa", "bbbbbbbbbbbb"]);
      expect(await set("aaaaaaaaaaaa", null)).not.toHaveProperty("aaaaaaaaaaaa");
      await expect(set("not-an-id", mia)).rejects.toThrow();
      await expect(set("cccccccccccc", { label: "x".repeat(2000) })).rejects.toThrow();
      await expect(
        db.exec(
          `set role anon; select public.set_shared_allergies('abcdefgh23', 'dddddddddddd', '{}')`,
        ),
      ).rejects.toThrow();
      await db.exec("reset role");
      expect(await set("eeeeeeeeeeee", mia)).not.toBeNull();
      await db.exec(`update public.shared_orders set expires_at = now() - interval '1 minute'`);
      expect(await set("ffffffffffff", mia)).toBeNull();
    } finally {
      await db.close();
    }
  }, 30000);
});
