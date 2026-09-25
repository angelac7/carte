import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
let restaurant: string;
const ids: Record<string, string> = {};

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values (gen_random_uuid()), (gen_random_uuid());
    insert into public.restaurants (owner_id, name, slug)
      select id, 'Cafe ' || row_number() over (), 'cafe-' || row_number() over () from auth.users;
    insert into public.menu_items (restaurant_id, name, confirmed)
      select r.id, d.name, d.confirmed from public.restaurants r,
        (values ('Soup', true), ('Draft', false)) as d(name, confirmed) where r.slug = 'cafe-1';
    insert into public.menu_items (restaurant_id, name, confirmed)
      select id, 'Elsewhere', true from public.restaurants where slug = 'cafe-2';
  `);
  restaurant = (
    await db.query<{ id: string }>("select id from public.restaurants where slug = 'cafe-1'")
  ).rows[0].id;
  for (const row of (
    await db.query<{ id: string; name: string }>("select id, name from public.menu_items")
  ).rows)
    ids[row.name] = row.id;
}, 30000);

afterAll(async () => {
  await db?.close();
});

const lines = async (code: string) =>
  (
    await db.query<{ lines: Record<string, number> }>(
      `select lines from public.get_shared_order('${code}')`,
    )
  ).rows[0]?.lines;

it("starts a shared order with only real, confirmed dishes from that restaurant", async () => {
  const initial = JSON.stringify({ [ids.Soup]: 2, [ids.Draft]: 1, [ids.Elsewhere]: 1, junk: 3 });
  await db.query(`select public.create_shared_order('${restaurant}', 'abcdefgh23', $1::jsonb)`, [
    initial,
  ]);
  expect(await lines("abcdefgh23")).toEqual({ [ids.Soup]: 2 });
});

it("changes one line at a time, including lines with a size and add-ons", async () => {
  const choice = `${ids.Soup}|1|0.2`;
  await db.query(`select public.set_shared_line('abcdefgh23', $1, 1)`, [choice]);
  await db.query(`select public.set_shared_line('abcdefgh23', $1, 50)`, [ids.Soup]);
  expect(await lines("abcdefgh23")).toEqual({ [ids.Soup]: 20, [choice]: 1 });
  await db.query(`select public.set_shared_line('abcdefgh23', $1, 0)`, [ids.Soup]);
  expect(await lines("abcdefgh23")).toEqual({ [choice]: 1 });
  await expect(
    db.query(`select public.set_shared_line('abcdefgh23', $1, 1)`, [ids.Elsewhere]),
  ).rejects.toThrow(/unknown dish/);
});

it("ends after six hours, and can't be reached directly by visitors", async () => {
  await db.exec(`update public.shared_orders set expires_at = now() - interval '1 minute'`);
  expect(await lines("abcdefgh23")).toBeUndefined();
  await db.exec("set role anon");
  try {
    await expect(db.query("select * from public.get_shared_order('abcdefgh23')")).rejects.toThrow(
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});
