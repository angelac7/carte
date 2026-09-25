import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
let restaurant: string;

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values (gen_random_uuid());
    insert into public.restaurants (owner_id, name, slug) select id, 'Cafe', 'cafe' from auth.users;
    insert into public.menu_items (restaurant_id, name, confirmed)
      select r.id, d.name, d.confirmed from public.restaurants r,
        (values ('A', true), ('B', true), ('C', true), ('D', true), ('Quiet', true), ('Draft', false))
        as d(name, confirmed);
    insert into public.dish_stats (menu_item_id, day, views)
      select m.id, current_date, case m.name
        when 'A' then 50 when 'B' then 40 when 'C' then 30 when 'D' then 20
        when 'Quiet' then 3 else 999 end
      from public.menu_items m;
  `);
  restaurant = (await db.query<{ id: string }>("select id from public.restaurants")).rows[0].id;
}, 30000);

afterAll(async () => {
  await db?.close();
});

it("names at most three well-viewed, confirmed dishes, and never their counts", async () => {
  const result = await db.query<Record<string, string>>(
    `select m.name, p.* from public.popular_dishes('${restaurant}') p
     join public.menu_items m on m.id = p.dish_id`,
  );
  expect(result.rows.map((row) => row.name)).toEqual(["A", "B", "C"]);
  expect(Object.keys(result.rows[0]).sort()).toEqual(["dish_id", "name"]);
});
