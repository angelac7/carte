import { afterAll, beforeAll, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDatabase } from "./helpers/test-database";
let db: PGlite;
let restaurant: string;
let user: string;
let dish: string;
beforeAll(async () => {
  db = await createTestDatabase();
  user = (
    await db.query<{ id: string }>("insert into auth.users values(gen_random_uuid()) returning id")
  ).rows[0].id;
  restaurant = (
    await db.query<{ id: string }>(
      "insert into restaurants(owner_id,name,slug) values($1,'Review cafe','review-cafe') returning id",
      [user],
    )
  ).rows[0].id;
  await db.exec(`set test.uid = '${user}'`);
  dish = (
    await db.query<{ id: string }>(
      "insert into menu_items(restaurant_id,name,confirmed,allergen_list,also_checked) values($1,'Soup',true,2,true) returning id",
      [restaurant],
    )
  ).rows[0].id;
  await db.exec("set role authenticated");
}, 30000);
afterAll(async () => {
  await db?.close();
});
const current = async () =>
  (
    await db.query<{ revision: number; confirmed: boolean }>(
      "select revision,confirmed from menu_items where id=$1",
      [dish],
    )
  ).rows[0];
const review = (version: number) =>
  db.query("select review_dish_again($1,$2,$3)", [restaurant, dish, version]);
it("records a new review in the audit trail and preserves confirmation atomically", async () => {
  const before = await current();
  await review(before.revision);
  expect(await current()).toEqual({ revision: before.revision + 2, confirmed: true });
  expect(
    (
      await db.query("select id from dish_history where menu_item_id=$1 and action='confirmed'", [
        dish,
      ])
    ).rows,
  ).toHaveLength(2);
  const dates = (
    await db.query<{ menu_item_id: string; reviewed_at: Date }>(
      "select * from latest_dish_reviews($1)",
      [restaurant],
    )
  ).rows;
  expect(dates[0].menu_item_id).toBe(dish);
  expect(dates[0].reviewed_at).toBeTruthy();
  await expect(review(before.revision)).rejects.toThrow(/Dish changed/);
  expect((await current()).confirmed).toBe(true);
});
it("does not let another user read reviews or re-confirm the restaurant's dishes", async () => {
  await db.exec("set test.uid = '00000000-0000-0000-0000-000000000001'");
  expect((await db.query("select * from latest_dish_reviews($1)", [restaurant])).rows).toHaveLength(
    0,
  );
  await expect(review(3)).rejects.toThrow(/Not authorized/);
  await db.exec(`set test.uid = '${user}'`);
});
it("requires a normal full review after edits and never invents a date for a draft", async () => {
  await db.query("update menu_items set notes='New preparation' where id=$1", [dish]);
  const edited = await current();
  expect(edited.confirmed).toBe(false);
  await expect(review(edited.revision)).rejects.toThrow(/Dish changed/);
  const draft = (
    await db.query<{ id: string }>(
      "insert into menu_items(restaurant_id,name) values($1,'Draft') returning id",
      [restaurant],
    )
  ).rows[0].id;
  expect(
    (
      await db.query<{ menu_item_id: string }>("select * from latest_dish_reviews($1)", [
        restaurant,
      ])
    ).rows.some((row) => row.menu_item_id === draft),
  ).toBe(false);
});
