import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
const ids: Record<string, string> = {};
let mine: string;

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values (gen_random_uuid()), (gen_random_uuid());
    insert into public.restaurants (owner_id, name, slug)
      select id, 'Cafe ' || row_number() over (), 'cafe-' || row_number() over () from auth.users;
    insert into public.menu_items (restaurant_id, name, confirmed, sort_order)
      select r.id, d.name, true, d.n
      from public.restaurants r, (values ('Soup', 1), ('Salad', 2), ('Cake', 3)) as d(name, n)
      where r.slug = 'cafe-1';
    insert into public.menu_items (restaurant_id, name, confirmed, sort_order)
      select id, 'Theirs', true, 1 from public.restaurants where slug = 'cafe-2';
  `);
  for (const row of (
    await db.query<{ id: string; name: string }>("select id, name from public.menu_items")
  ).rows)
    ids[row.name] = row.id;
  mine = (await db.query<{ id: string }>("select id from public.restaurants where slug = 'cafe-1'"))
    .rows[0].id;
}, 30000);

afterAll(async () => {
  await db?.close();
});

const order = async () =>
  (
    await db.query<{ name: string }>(
      `select name from public.menu_items where restaurant_id = '${mine}' order by sort_order`,
    )
  ).rows.map((row) => row.name);

it("saves a new order and returns only the dishes that moved", async () => {
  const moved = await db.query<{ id: string; revision: number }>(
    `select * from public.reorder_dishes('${mine}', array['${ids.Cake}', '${ids.Soup}', '${ids.Salad}']::uuid[])`,
  );
  expect(await order()).toEqual(["Cake", "Soup", "Salad"]);
  expect(moved.rows.map((row) => row.id).sort()).toEqual([ids.Cake, ids.Salad, ids.Soup].sort());
  expect(moved.rows.every((row) => row.revision === 2)).toBe(true);
});

it("never moves another restaurant's dishes", async () => {
  await db.query(`select * from public.reorder_dishes('${mine}', array['${ids.Theirs}']::uuid[])`);
  const theirs = await db.query<{ sort_order: number }>(
    `select sort_order from public.menu_items where id = '${ids.Theirs}'`,
  );
  expect(theirs.rows[0].sort_order).toBe(1);
});

it("keeps dishes confirmed when only their section or order changes", async () => {
  await db.exec(`update public.menu_items set section = 'Desserts' where id = '${ids.Cake}'`);
  const cake = await db.query<{ confirmed: boolean }>(
    `select confirmed from public.menu_items where id = '${ids.Cake}'`,
  );
  expect(cake.rows[0].confirmed).toBe(true);
  await db.exec(
    `update public.menu_items set description = 'Now with nuts' where id = '${ids.Cake}'`,
  );
  const edited = await db.query<{ confirmed: boolean }>(
    `select confirmed from public.menu_items where id = '${ids.Cake}'`,
  );
  expect(edited.rows[0].confirmed).toBe(false);
});

it("keeps dishes confirmed when their availability changes", async () => {
  await db.exec(`
    update public.menu_items
    set sold_out_on = current_date, special = true, available_from = '11:00', available_until = '15:00'
    where id = '${ids.Soup}'`);
  const soup = await db.query<{ confirmed: boolean }>(
    `select confirmed from public.menu_items where id = '${ids.Soup}'`,
  );
  expect(soup.rows[0].confirmed).toBe(true);
});

it("needs both serving times, or neither", async () => {
  await expect(
    db.exec(`update public.menu_items set available_from = '11:00' where id = '${ids.Salad}'`),
  ).rejects.toThrow(/menu_items_serving_window/);
});

it("checks add-on allergens and asks for a fresh review when add-ons change", async () => {
  await expect(
    db.exec(`update public.menu_items
      set addons = '[{"label":"Add nuts","price":"$1","allergens":["walnut dust"]}]'
      where id = '${ids.Salad}'`),
  ).rejects.toThrow(/check constraint/);
  await db.exec(`update public.menu_items set confirmed = true where id = '${ids.Salad}'`);
  await db.exec(`update public.menu_items
    set addons = '[{"label":"Add egg","price":"$2","allergens":["eggs"]}]',
        sizes = '[{"label":"Large","price":"$9"}]'
    where id = '${ids.Salad}'`);
  const salad = await db.query<{ confirmed: boolean }>(
    `select confirmed from public.menu_items where id = '${ids.Salad}'`,
  );
  expect(salad.rows[0].confirmed).toBe(false);
});

it("keeps leave-out and may-contain lists consistent with the dish", async () => {
  await expect(
    db.exec(
      `update public.menu_items set allergens = '{}', removable = array['sesame'] where id = '${ids.Cake}'`,
    ),
  ).rejects.toThrow(/menu_items_removable_in_dish/);
  await expect(
    db.exec(
      `update public.menu_items set allergens = array['milk'], may_contain = array['milk'] where id = '${ids.Cake}'`,
    ),
  ).rejects.toThrow(/menu_items_may_contain_not_in_dish/);
  await db.exec(
    `update public.menu_items set allergens = array['milk'], confirmed = true where id = '${ids.Cake}'`,
  );
  await db.exec(
    `update public.menu_items set may_contain = array['peanuts'] where id = '${ids.Cake}'`,
  );
  const cake = await db.query<{ confirmed: boolean }>(
    `select confirmed from public.menu_items where id = '${ids.Cake}'`,
  );
  expect(cake.rows[0].confirmed).toBe(false);
});
