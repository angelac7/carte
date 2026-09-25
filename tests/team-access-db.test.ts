import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
const OWNER = "00000000-0000-0000-0000-00000000000a";
const EDITOR = "00000000-0000-0000-0000-00000000000b";
const STRANGER = "00000000-0000-0000-0000-00000000000c";
let restaurant: string;
let dish: string;

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values ('${OWNER}'), ('${EDITOR}'), ('${STRANGER}');
    insert into public.restaurants (owner_id, name, slug) values ('${OWNER}', 'Cafe', 'cafe');
    insert into public.menu_items (restaurant_id, name, confirmed)
      select id, 'Soup', true from public.restaurants;
  `);
  restaurant = (await db.query<{ id: string }>("select id from public.restaurants")).rows[0].id;
  dish = (await db.query<{ id: string }>("select id from public.menu_items")).rows[0].id;
}, 30000);

afterAll(async () => {
  await db?.close();
});

/** Runs SQL as a signed-in person, with the same limits the app has. */
async function as<T = Record<string, unknown>>(user: string, sql: string) {
  await db.exec(`set test.uid = '${user}'; set role authenticated;`);
  try {
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec("reset role; reset test.uid;");
  }
}

const rename = (user: string, name: string) =>
  as(user, `update public.menu_items set name = '${name}' where id = '${dish}' returning id`);

describe("locations and staff", () => {
  it("lets an owner run a second location", async () => {
    await as(
      OWNER,
      `insert into public.restaurants (owner_id, name, slug) values ('${OWNER}', 'Cafe Two', 'cafe-two')`,
    );
    const mine = await db.query(`select slug from public.restaurants where owner_id = '${OWNER}'`);
    expect(mine.rows).toHaveLength(2);
  });

  it("keeps strangers out of the menu and the team", async () => {
    expect(await rename(STRANGER, "Hacked")).toEqual([]);
    expect(await as(STRANGER, "select * from public.restaurant_members")).toEqual([]);
    await expect(
      as(
        STRANGER,
        `insert into public.restaurant_invites (code, restaurant_id) values ('abcdefghjkmn', '${restaurant}')`,
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("adds an editor through a one-time invite", async () => {
    await as(
      OWNER,
      `insert into public.restaurant_invites (code, restaurant_id) values ('abcdefghjkmn', '${restaurant}')`,
    );
    const joined = await as<{ accept_invite: string }>(
      EDITOR,
      "select public.accept_invite('abcdefghjkmn')",
    );
    expect(joined[0].accept_invite).toBe(restaurant);
    const again = await as<{ accept_invite: string | null }>(
      STRANGER,
      "select public.accept_invite('abcdefghjkmn')",
    );
    expect(again[0].accept_invite).toBeNull();
  });

  it("lets editors change the menu and see reports and stats, but not manage the team", async () => {
    expect(await rename(EDITOR, "Tomato soup")).toHaveLength(1);
    const stats = await as(EDITOR, `select * from public.restaurant_dish_views('${restaurant}')`);
    expect(stats).toHaveLength(1);
    expect(
      await as(STRANGER, `select * from public.restaurant_dish_views('${restaurant}')`),
    ).toEqual([]);
    await expect(
      as(
        EDITOR,
        `insert into public.restaurant_invites (code, restaurant_id) values ('pqrstuvwxyz2', '${restaurant}')`,
      ),
    ).rejects.toThrow(/row-level security/);
    expect(
      await as(EDITOR, `delete from public.restaurants where id = '${restaurant}' returning id`),
    ).toEqual([]);
  });

  it("removes an editor's access when the owner takes them off the team", async () => {
    await as(OWNER, `delete from public.restaurant_members where user_id = '${EDITOR}'`);
    expect(await rename(EDITOR, "Mine now")).toEqual([]);
  });
});
