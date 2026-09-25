import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

let db: PGlite;
let confirmedDish: string;
let draftDish: string;
let restaurant: string;

beforeAll(async () => {
  db = new PGlite();
  // Like Supabase: the API roles get table access by default, and policies narrow it.
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as 'select null::uuid';
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  `);
  for (const file of readdirSync("supabase/migrations")
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
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
