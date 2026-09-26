import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
const OWNER = "00000000-0000-0000-0000-00000000000a";
const EDITOR = "00000000-0000-0000-0000-00000000000b";
const STRANGER = "00000000-0000-0000-0000-00000000000c";
let restaurant: string;
let dish: string;

type HistoryRow = {
  action: string;
  changed_by: string | null;
  dish_name: string;
  safety: { allergens: string[]; may_contain: string[]; addon_allergens: unknown[] };
};

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values ('${OWNER}'), ('${EDITOR}'), ('${STRANGER}');
    insert into public.restaurants (owner_id, name, slug) values ('${OWNER}', 'Cafe', 'cafe');
    insert into public.restaurant_members (restaurant_id, user_id)
      select id, '${EDITOR}' from public.restaurants;
  `);
  restaurant = (await db.query<{ id: string }>("select id from public.restaurants")).rows[0].id;
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

const history = async () =>
  (
    await db.query<HistoryRow>(
      `select action, changed_by, dish_name, safety from public.dish_history
       where menu_item_id = '${dish}' order by id`,
    )
  ).rows;

describe("allergen history", () => {
  it("records a new dish, and who added it", async () => {
    const [row] = await as<{ id: string }>(
      OWNER,
      `insert into public.menu_items (restaurant_id, name, allergens)
       values ('${restaurant}', 'Noodles', '{wheat}') returning id`,
    );
    dish = row.id;
    const rows = await history();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: "added", changed_by: OWNER, dish_name: "Noodles" });
    expect(rows[0].safety.allergens).toEqual(["wheat"]);
  });

  it("records a confirmation by whoever confirmed it", async () => {
    await as(EDITOR, `update public.menu_items set confirmed = true where id = '${dish}'`);
    expect((await history()).at(-1)).toMatchObject({ action: "confirmed", changed_by: EDITOR });
  });

  it("records allergen changes, which also unconfirm the dish", async () => {
    await as(
      OWNER,
      `update public.menu_items set allergens = '{wheat,peanuts}', may_contain = '{sesame}'
       where id = '${dish}'`,
    );
    const last = (await history()).at(-1)!;
    expect(last).toMatchObject({ action: "edited", changed_by: OWNER });
    expect(last.safety.allergens).toEqual(["wheat", "peanuts"]);
    expect(last.safety.may_contain).toEqual(["sesame"]);
    const { rows } = await db.query<{ confirmed: boolean }>(
      `select confirmed from public.menu_items where id = '${dish}'`,
    );
    expect(rows[0].confirmed).toBe(false);
  });

  it("records add-on allergens", async () => {
    await as(
      OWNER,
      `update public.menu_items
       set addons = '[{"label":"Peanut sauce","price":"1","allergens":["peanuts"]},{"label":"Lime","price":"","allergens":[]}]'
       where id = '${dish}'`,
    );
    expect((await history()).at(-1)!.safety.addon_allergens).toEqual([
      { label: "Peanut sauce", allergens: ["peanuts"] },
    ]);
  });

  it("ignores changes that aren't about allergens, like the name or order", async () => {
    const before = (await history()).length;
    await as(
      OWNER,
      `update public.menu_items set name = 'Cold Noodles', sort_order = 5 where id = '${dish}'`,
    );
    expect(await history()).toHaveLength(before);
  });

  it("is visible to the owner and editors only", async () => {
    const count = `select count(*)::int as n from public.dish_history where restaurant_id = '${restaurant}'`;
    const total = (await history()).length;
    expect((await as<{ n: number }>(OWNER, count))[0].n).toBe(total);
    expect((await as<{ n: number }>(EDITOR, count))[0].n).toBe(total);
    expect((await as<{ n: number }>(STRANGER, count))[0].n).toBe(0);
  });

  it("can't be written or changed by anyone, only by the database", async () => {
    await expect(
      as(
        OWNER,
        `insert into public.dish_history (restaurant_id, menu_item_id, dish_name, action, safety)
         values ('${restaurant}', '${dish}', 'x', 'confirmed', '{}')`,
      ),
    ).rejects.toThrow();
    await expect(
      as(OWNER, `update public.dish_history set action = 'confirmed'`),
    ).rejects.toThrow();
    await expect(as(OWNER, `delete from public.dish_history`)).rejects.toThrow();
  });

  it("records a deleted dish", async () => {
    await as(OWNER, `delete from public.menu_items where id = '${dish}'`);
    expect((await history()).at(-1)).toMatchObject({ action: "deleted", changed_by: OWNER });
  });

  it("lets a whole restaurant be deleted, history and all", async () => {
    await as(
      OWNER,
      `insert into public.menu_items (restaurant_id, name) values ('${restaurant}', 'Tea')`,
    );
    await db.exec(`delete from public.restaurants where id = '${restaurant}'`);
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from public.dish_history where restaurant_id = '${restaurant}'`,
    );
    expect(rows[0].n).toBe(0);
  });
});
