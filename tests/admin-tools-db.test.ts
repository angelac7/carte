import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const OWNER = "00000000-0000-0000-0000-00000000000a";
let restaurant: string;

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values ('${ADMIN}'), ('${OWNER}');
    insert into public.carte_admins values ('${ADMIN}');
    insert into public.restaurants (owner_id, name, slug, listed) values ('${OWNER}', 'Cafe', 'cafe', true);
    insert into public.menu_items (restaurant_id, name, confirmed, allergen_list)
      select id, 'Salad', true, 2 from public.restaurants;
  `);
  restaurant = (await db.query<{ id: string }>("select id from public.restaurants")).rows[0].id;
}, 30000);

afterAll(async () => {
  await db?.close();
});

async function as(user: string, sql: string) {
  await db.exec(`set test.uid = '${user}'; set role authenticated;`);
  try {
    return (await db.query<Record<string, unknown>>(sql)).rows;
  } finally {
    await db.exec("reset role; reset test.uid;");
  }
}

const discover = async () =>
  (await db.query("select * from public.search_dishes('salad')")).rows.length;

it("shows the overview only to administrators", async () => {
  expect(await as(ADMIN, "select * from public.admin_restaurants()")).toHaveLength(1);
  expect(await as(OWNER, "select * from public.admin_restaurants()")).toEqual([]);
});

it("lets only administrators suspend a menu, which takes it off Discover", async () => {
  expect(await discover()).toBe(1);
  await expect(as(OWNER, `select public.admin_moderate('${restaurant}', false)`)).rejects.toThrow(
    /Administrators only/,
  );
  await as(ADMIN, `select public.admin_moderate('${restaurant}', true)`);
  expect(await discover()).toBe(0);
});

it("never lets an owner lift a suspension themselves", async () => {
  await expect(
    as(OWNER, `update public.restaurants set suspended = false where id = '${restaurant}'`),
  ).rejects.toThrow(/permission denied/);
  await as(ADMIN, `select public.admin_moderate('${restaurant}', false)`);
  expect(await discover()).toBe(1);
});
