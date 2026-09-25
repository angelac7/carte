import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { normalizeSearch } from "@/lib/diner-interest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
const OWNER = "00000000-0000-0000-0000-00000000000a";
const STRANGER = "00000000-0000-0000-0000-00000000000c";
let restaurant: string;

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values ('${OWNER}'), ('${STRANGER}');
    insert into public.restaurants (owner_id, name, slug) values ('${OWNER}', 'Cafe', 'cafe');
  `);
  restaurant = (await db.query<{ id: string }>("select id from public.restaurants")).rows[0].id;
  const visit = (avoid: string, diets: string, missed: string) =>
    db.exec(
      `select public.record_diner_interest('${restaurant}', ${avoid}, ${diets}, '${missed}')`,
    );
  await visit("array['peanuts','milk']", "array['vegan']", "");
  await visit("array['peanuts']", "'{}'", "pho");
  await visit("'{}'", "'{}'", "pho");
  await visit("'{}'", "'{}'", "once only");
}, 30000);

afterAll(async () => {
  await db?.close();
});

async function as(user: string, sql: string) {
  await db.exec(`set test.uid = '${user}'; set role authenticated;`);
  try {
    return (await db.query<{ kind: string; value: string; uses: number }>(sql)).rows;
  } finally {
    await db.exec("reset role; reset test.uid;");
  }
}

it("shows owners anonymous totals, and a missed search only once it repeats", async () => {
  const rows = await as(OWNER, `select * from public.restaurant_diner_interest('${restaurant}')`);
  const find = (kind: string, value: string) =>
    rows.find((r) => r.kind === kind && r.value === value);
  expect(Number(find("avoid", "peanuts")?.uses)).toBe(2);
  expect(Number(find("diet", "vegan")?.uses)).toBe(1);
  expect(Number(find("missed_search", "pho")?.uses)).toBe(2);
  expect(find("missed_search", "once only")).toBeUndefined();
});

it("keeps totals from other people, and visitors can't record directly", async () => {
  expect(
    await as(STRANGER, `select * from public.restaurant_diner_interest('${restaurant}')`),
  ).toEqual([]);
  await expect(
    as(STRANGER, `select public.record_diner_interest('${restaurant}', '{}', '{}', 'spam')`),
  ).rejects.toThrow(/permission denied/);
});

it("groups searches that differ only in case and spacing", () => {
  expect(normalizeSearch("  Beef   PHO ")).toBe("beef pho");
  expect(normalizeSearch("x".repeat(60))).toHaveLength(40);
});
