import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
const OWNER = "00000000-0000-0000-0000-00000000000a";
const EDITOR = "00000000-0000-0000-0000-00000000000b";
const STRANGER = "00000000-0000-0000-0000-00000000000c";
const ADMIN = "00000000-0000-0000-0000-00000000000d";
let restaurant: string;
let other: string;

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values ('${OWNER}'), ('${EDITOR}'), ('${STRANGER}'), ('${ADMIN}');
    insert into public.carte_admins (user_id) values ('${ADMIN}');
    insert into public.restaurants (owner_id, name, slug) values
      ('${OWNER}', 'Cafe', 'cafe'), ('${STRANGER}', 'Elsewhere', 'elsewhere');
    insert into public.restaurant_members (restaurant_id, user_id)
      select id, '${EDITOR}' from public.restaurants where slug = 'cafe';
  `);
  const ids = (await db.query<{ id: string; slug: string }>("select id, slug from restaurants"))
    .rows;
  restaurant = ids.find((r) => r.slug === "cafe")!.id;
  other = ids.find((r) => r.slug === "elsewhere")!.id;
}, 30000);

afterAll(async () => {
  await db?.close();
});

/** Runs SQL as a signed-in person, or as a visitor with null, with the same limits as the app. */
async function as<T = Record<string, unknown>>(
  user: string | null,
  sql: string,
  params?: unknown[],
) {
  await db.exec(user ? `set test.uid = '${user}'; set role authenticated;` : "set role anon;");
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec("reset role; reset test.uid;");
  }
}

const addDish = async (name: string, extra = "") =>
  (
    await db.query<{ id: string }>(
      `insert into menu_items (restaurant_id, name, confirmed${extra ? ", " + extra.split("=")[0] : ""})
       values ($1, $2, true${extra ? ", " + extra.split("=")[1] : ""}) returning id`,
      [restaurant, name],
    )
  ).rows[0].id;
const visible = async (user: string | null = null) =>
  (await as<{ name: string }>(user, "select name from menu_items order by name")).map(
    (r) => r.name,
  );

describe("AI spending limits", () => {
  const call = (restaurantId: string | null, restaurantLimit: number, daily: number) =>
    db
      .query<{ ok: boolean }>("select public.consume_ai_call($1, 'chat', $2, $3) as ok", [
        restaurantId,
        restaurantLimit,
        daily,
      ])
      .then((result) => result.rows[0].ok);

  it("counts calls until a restaurant or all of Carte reaches today's limit", async () => {
    expect(await call(restaurant, 2, 10)).toBe(true);
    expect(await call(restaurant, 2, 10)).toBe(true);
    expect(await call(restaurant, 2, 10)).toBe(false);
    expect(await call(other, 2, 10)).toBe(true);
    expect(await call(null, 2, 3)).toBe(false);
    expect(await call(null, 2, 10)).toBe(true);
    const rows = await db.query<{ calls: number }>(
      "select sum(calls)::int as calls from ai_usage where day = current_date",
    );
    expect(rows.rows[0].calls).toBe(4);
  });

  it("shows usage only to administrators, and only the server can count calls", async () => {
    const usage = await as<{ restaurant_name: string | null; today: string }>(
      ADMIN,
      "select * from admin_ai_usage(30)",
    );
    expect(usage.map((row) => [row.restaurant_name, Number(row.today)])).toEqual([
      ["Cafe", 2],
      ["Elsewhere", 1],
      [null, 1],
    ]);
    expect(await as(OWNER, "select * from admin_ai_usage(30)")).toEqual([]);
    await expect(as(OWNER, "select public.consume_ai_call(null, 'chat', 99, 99)")).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("draft menus", () => {
  let live: string;
  let draft: string;

  it("keeps a draft hidden from diners, even once it's confirmed", async () => {
    live = await addDish("Live soup");
    draft = (
      await as<{ id: string }>(
        OWNER,
        `insert into menu_items (restaurant_id, name, draft) values ('${restaurant}', 'Draft stew', true) returning id`,
      )
    )[0].id;
    await as(OWNER, `update menu_items set confirmed = true where id = '${draft}'`);
    const row = (
      await db.query<{ confirmed: boolean; draft_confirmed: boolean }>(
        "select confirmed, draft_confirmed from menu_items where id = $1",
        [draft],
      )
    ).rows[0];
    expect(row).toEqual({ confirmed: false, draft_confirmed: true });
    expect(await visible()).toEqual(["Live soup"]);
    await expect(
      db.query(
        "insert into menu_items (restaurant_id, name, draft, confirmed) values ($1, 'Sneaky', true, true)",
        [restaurant],
      ),
    ).rejects.toThrow(/menu_items_drafts_stay_hidden/);
  });

  it("needs a draft dish confirmed again after it's edited", async () => {
    await as(OWNER, `update menu_items set allergens = '{milk}' where id = '${draft}'`);
    await expect(as(OWNER, `select publish_draft('${restaurant}', true)`)).rejects.toThrow(
      /Confirm every draft dish/,
    );
    await as(OWNER, `update menu_items set confirmed = true where id = '${draft}'`);
  });

  it("only lets the restaurant's team publish", async () => {
    await expect(as(STRANGER, `select publish_draft('${restaurant}', true)`)).rejects.toThrow(
      /Not authorized/,
    );
  });

  it("swaps the draft in for the current menu in one step", async () => {
    const [{ publish_draft }] = await as<{ publish_draft: number }>(
      EDITOR,
      `select publish_draft('${restaurant}', true)`,
    );
    expect(publish_draft).toBe(1);
    expect(await visible()).toEqual(["Draft stew"]);
    const history = await db.query<{ action: string; dish_name: string }>(
      "select action, dish_name from dish_history where dish_name in ('Live soup', 'Draft stew') order by id desc limit 2",
    );
    expect(history.rows.map((row) => [row.dish_name, row.action])).toEqual([
      ["Draft stew", "confirmed"],
      ["Live soup", "deleted"],
    ]);
    expect(live).toBeTruthy();
  });

  it("can add a draft to the menu, or throw it away", async () => {
    await as(
      OWNER,
      `insert into menu_items (restaurant_id, name, draft) values ('${restaurant}', 'Pie', true)`,
    );
    expect(
      (await as<{ discard_draft: number }>(OWNER, `select discard_draft('${restaurant}')`))[0]
        .discard_draft,
    ).toBe(1);
    await expect(as(OWNER, `select publish_draft('${restaurant}', false)`)).rejects.toThrow(
      /No draft/,
    );
    await as(
      OWNER,
      `insert into menu_items (restaurant_id, name, draft) values ('${restaurant}', 'Tart', true)`,
    );
    await as(OWNER, `update menu_items set confirmed = true where name = 'Tart'`);
    await as(OWNER, `select publish_draft('${restaurant}', false)`);
    expect(await visible()).toEqual(["Draft stew", "Tart"]);
  });
});

describe("seasonal menus", () => {
  let brunch: string;

  it("hides a group's dishes while it's switched off, keeping them confirmed", async () => {
    brunch = (
      await as<{ id: string }>(
        OWNER,
        `insert into dish_groups (restaurant_id, name) values ('${restaurant}', 'Brunch') returning id`,
      )
    )[0].id;
    await as(EDITOR, `update menu_items set group_id = '${brunch}' where name = 'Tart'`);
    await as(OWNER, `update dish_groups set active = false where id = '${brunch}'`);
    expect(await visible()).toEqual(["Draft stew"]);
    const tart = await db.query<{ confirmed: boolean; in_season: boolean }>(
      "select confirmed, in_season from menu_items where name = 'Tart'",
    );
    expect(tart.rows[0]).toEqual({ confirmed: true, in_season: false });
    const found = await as<{ dish_name: string }>(
      null,
      "select dish_name from search_dishes('tart')",
    );
    expect(found).toEqual([]);
    await as(OWNER, `update dish_groups set active = true where id = '${brunch}'`);
    expect(await visible()).toEqual(["Draft stew", "Tart"]);
  });

  it("puts a dish back on the menu when its group is removed", async () => {
    await as(OWNER, `update dish_groups set active = false where id = '${brunch}'`);
    await as(OWNER, `delete from dish_groups where id = '${brunch}'`);
    expect(await visible()).toEqual(["Draft stew", "Tart"]);
  });

  it("keeps groups to their own restaurant and team", async () => {
    const theirs = (
      await db.query<{ id: string }>(
        "insert into dish_groups (restaurant_id, name) values ($1, 'Theirs') returning id",
        [other],
      )
    ).rows[0].id;
    await expect(
      as(OWNER, `update menu_items set group_id = '${theirs}' where name = 'Tart'`),
    ).rejects.toThrow(/unknown seasonal menu/);
    expect(await as(OWNER, "select name from dish_groups")).toEqual([]);
    await expect(as(null, "select name from dish_groups")).rejects.toThrow(/permission denied/);
  });
});

describe("corrected translations", () => {
  it("lets the restaurant's team correct a translation, and no one else", async () => {
    const tart = (await db.query<{ id: string }>("select id from menu_items where name = 'Tart'"))
      .rows[0].id;
    const save = (user: string) =>
      as(
        user,
        `insert into translations (menu_item_id, language, source_hash, name, edited_at)
         values ('${tart}', 'es', 'hash', 'Tarta', now())
         on conflict (menu_item_id, language) do update set name = excluded.name, edited_at = now()`,
      );
    await save(EDITOR);
    await expect(save(STRANGER)).rejects.toThrow(/row-level security/);
    expect(await as(null, "select name from translations")).toEqual([{ name: "Tarta" }]);
  });
});

describe("suspended menus", () => {
  it("are hidden from everyone but their team and Carte's administrators", async () => {
    await db.query("update restaurants set suspended = true where id = $1", [restaurant]);
    const names = (user: string | null) =>
      as<{ name: string }>(user, "select name from restaurants order by name").then((rows) =>
        rows.map((r) => r.name),
      );
    expect(await names(null)).toEqual(["Elsewhere"]);
    expect(await visible()).toEqual([]);
    expect(await names(STRANGER)).toEqual(["Elsewhere"]);
    expect(await names(EDITOR)).toEqual(["Cafe", "Elsewhere"]);
    expect(await names(ADMIN)).toEqual(["Cafe", "Elsewhere"]);
    expect(await visible(OWNER)).toEqual(["Draft stew", "Tart"]);
    await db.query("update restaurants set suspended = false where id = $1", [restaurant]);
  });
});

describe("restaurant profile", () => {
  it("lets the team save every profile setting, but never approve a claim or lift a suspension", async () => {
    await as(
      OWNER,
      `update restaurants set description = 'Cosy', features = '{quiet}',
         kitchen_practices = '{}', currency = 'USD' where id = '${restaurant}'`,
    );
    await expect(
      as(OWNER, `update restaurants set suspended = false where id = '${restaurant}'`),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(OWNER, `update restaurants set osm_verified = true where id = '${restaurant}'`),
    ).rejects.toThrow(/permission denied/);
  });
});
