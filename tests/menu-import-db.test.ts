import { afterAll, beforeAll, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDatabase } from "./helpers/test-database";
let db: PGlite;
let restaurant: string;
let user: string;
beforeAll(async () => {
  db = await createTestDatabase();
  user = (
    await db.query<{ id: string }>("insert into auth.users values(gen_random_uuid()) returning id")
  ).rows[0].id;
  restaurant = (
    await db.query<{ id: string }>(
      "insert into restaurants(owner_id,name,slug) values($1,'Import cafe','import-cafe') returning id",
      [user],
    )
  ).rows[0].id;
  await db.exec(`set test.uid = '${user}'`);
}, 30000);
afterAll(async () => {
  await db?.close();
});
async function preview(add: unknown[], change: unknown[] = []) {
  const snapshot = (
    await db.query("select id,revision from menu_items where restaurant_id=$1", [restaurant])
  ).rows;
  return (
    await db.query<{ id: string }>(
      "insert into menu_imports(restaurant_id,snapshot,payload) values($1,$2,$3) returning id",
      [
        restaurant,
        JSON.stringify(snapshot),
        JSON.stringify({ add, change, summary: { added: add.length } }),
      ],
    )
  ).rows[0].id;
}
const apply = (id: string) => db.query("select apply_menu_import($1,$2)", [id, restaurant]);
it("applies once, even when a lost response is retried", async () => {
  const id = await preview([{ name: "Soup" }]);
  await apply(id);
  await apply(id);
  expect((await db.query("select id from menu_items where name='Soup'")).rows).toHaveLength(1);
  expect(
    (await db.query<{ confirmed: boolean }>("select confirmed from menu_items where name='Soup'"))
      .rows[0].confirmed,
  ).toBe(false);
});
it("rejects a stale preview without changing any dish or adding rows", async () => {
  const dish = (
    await db.query<{ id: string; [key: string]: unknown }>(
      "select * from menu_items where name='Soup'",
    )
  ).rows[0];
  const id = await preview([{ name: "Should not appear" }], [{ ...dish, notes: "old preview" }]);
  await db.query("update menu_items set notes='Other tab' where id=$1", [dish.id]);
  await expect(apply(id)).rejects.toThrow(/Menu changed/);
  expect(
    (await db.query<{ notes: string }>("select notes from menu_items where id=$1", [dish.id]))
      .rows[0].notes,
  ).toBe("Other tab");
  expect(
    (await db.query("select id from menu_items where name='Should not appear'")).rows,
  ).toHaveLength(0);
});
it("rolls back additions if any later row fails and keeps retries free of duplicates", async () => {
  const id = await preview([{ name: "Rollback soup" }, { name: "Invalid", calories: -1 }]);
  await expect(apply(id)).rejects.toThrow();
  await expect(apply(id)).rejects.toThrow();
  expect(
    (await db.query("select id from menu_items where name='Rollback soup'")).rows,
  ).toHaveLength(0);
});
it("rejects another user's receipt and expired previews", async () => {
  const id = await preview([{ name: "Private" }]);
  await db.exec("set test.uid = '00000000-0000-0000-0000-000000000001'");
  await expect(apply(id)).rejects.toThrow(/Not authorized/);
  await db.exec(`set test.uid = '${user}'`);
  await db.query("update menu_imports set expires_at=now()-interval '1 minute' where id=$1", [id]);
  await expect(apply(id)).rejects.toThrow(/expired/);
});
