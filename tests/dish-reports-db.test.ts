import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
let confirmedDish: string;
let draftDish: string;
let restaurant: string;

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values (gen_random_uuid());
    insert into public.restaurants (owner_id, name, slug) select id, 'Cafe', 'cafe' from auth.users;
    insert into public.menu_items (restaurant_id, name, confirmed)
      select id, 'Soup', true from public.restaurants;
    insert into public.menu_items (restaurant_id, name, confirmed)
      select id, 'Draft', false from public.restaurants;
  `);
  const dishes = await db.query<{ id: string; name: string; restaurant_id: string }>(
    "select id, name, restaurant_id from public.menu_items",
  );
  confirmedDish = dishes.rows.find((row) => row.name === "Soup")!.id;
  draftDish = dishes.rows.find((row) => row.name === "Draft")!.id;
  restaurant = dishes.rows[0].restaurant_id;
}, 30000);

afterAll(async () => {
  await db?.close();
});

async function asDiner<T>(sql: string): Promise<T> {
  await db.exec("set role anon");
  try {
    return (await db.query(sql)) as T;
  } finally {
    await db.exec("reset role");
  }
}

const insert = (dish: string, extra = "") =>
  `insert into public.dish_reports (restaurant_id, menu_item_id, dish_name, kind${extra ? ", resolved" : ""})
   values ('${restaurant}', '${dish}', 'Soup', 'allergens'${extra})`;

it("lets diners report a confirmed dish", async () => {
  await asDiner(insert(confirmedDish));
  const saved = await db.query<{ resolved: boolean }>("select resolved from public.dish_reports");
  expect(saved.rows).toEqual([{ resolved: false }]);
});

it("refuses reports about unconfirmed dishes", async () => {
  await expect(asDiner(insert(draftDish))).rejects.toThrow(/row-level security/);
});

it("stops diners from reading reports or marking them resolved", async () => {
  await expect(asDiner(insert(confirmedDish, ", true"))).rejects.toThrow(/permission denied/);
  await expect(asDiner("select * from public.dish_reports")).rejects.toThrow(/permission denied/);
});
