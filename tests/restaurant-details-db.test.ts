import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
let id: string;
const base = "https://abc.supabase.co/storage/v1/object/public/dish-photos/";

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values (gen_random_uuid());
    insert into public.restaurants (owner_id, name, slug) select id, 'Cafe', 'cafe' from auth.users;
  `);
  id = (await db.query<{ id: string }>("select id from public.restaurants")).rows[0].id;
}, 30000);

afterAll(async () => {
  await db?.close();
});

it("only accepts a logo and cover from the restaurant's own folder", async () => {
  await db.exec(`update public.restaurants
    set logo_url = '${base}${id}/restaurant-logo-1.png', cover_url = '${base}${id}/restaurant-cover-2.jpg'
    where id = '${id}'`);
  await expect(
    db.exec(
      `update public.restaurants set logo_url = 'https://evil.example/logo.png' where id = '${id}'`,
    ),
  ).rejects.toThrow(/restaurants_own_images/);
  await expect(
    db.exec(`update public.restaurants
      set cover_url = '${base}00000000-0000-0000-0000-000000000000/restaurant-cover-1.jpg'
      where id = '${id}'`),
  ).rejects.toThrow(/restaurants_own_images/);
});

it("only accepts web links for the website and reservations", async () => {
  await db.exec(
    `update public.restaurants set website = 'https://cafe.example', price_range = 2 where id = '${id}'`,
  );
  await expect(
    db.exec(
      `update public.restaurants set reservation_url = 'javascript:alert(1)' where id = '${id}'`,
    ),
  ).rejects.toThrow(/check constraint/);
  await expect(
    db.exec(`update public.restaurants set price_range = 5 where id = '${id}'`),
  ).rejects.toThrow(/check constraint/);
});
