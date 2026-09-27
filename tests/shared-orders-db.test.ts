import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase } from "./helpers/test-database";

let db: PGlite;
let restaurant: string;
const ids: Record<string, string> = {};

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    insert into auth.users values (gen_random_uuid()), (gen_random_uuid());
    insert into public.restaurants (owner_id, name, slug)
      select id, 'Cafe ' || row_number() over (), 'cafe-' || row_number() over () from auth.users;
    insert into public.menu_items (restaurant_id, name, confirmed)
      select r.id, d.name, d.confirmed from public.restaurants r,
        (values ('Soup', true), ('Draft', false)) as d(name, confirmed) where r.slug = 'cafe-1';
    insert into public.menu_items (restaurant_id, name, confirmed)
      select id, 'Elsewhere', true from public.restaurants where slug = 'cafe-2';
  `);
  restaurant = (
    await db.query<{ id: string }>("select id from public.restaurants where slug = 'cafe-1'")
  ).rows[0].id;
  for (const row of (
    await db.query<{ id: string; name: string }>("select id, name from public.menu_items")
  ).rows)
    ids[row.name] = row.id;
}, 30000);

afterAll(async () => {
  await db?.close();
});

const lines = async (code: string) =>
  (
    await db.query<{ lines: Record<string, number> }>(
      `select lines from public.get_shared_order('${code}')`,
    )
  ).rows[0]?.lines;

it("starts a shared order with only real, confirmed dishes from that restaurant", async () => {
  const initial = JSON.stringify({ [ids.Soup]: 2, [ids.Draft]: 1, [ids.Elsewhere]: 1, junk: 3 });
  await db.query(`select public.create_shared_order('${restaurant}', 'abcdefgh23', $1::jsonb)`, [
    initial,
  ]);
  expect(await lines("abcdefgh23")).toEqual({ [ids.Soup]: 2 });
});

it("changes one line at a time, including lines with a size and add-ons", async () => {
  const choice = `${ids.Soup}|1|0.2`;
  await db.query(`select public.set_shared_line('abcdefgh23', $1, 1)`, [choice]);
  await db.query(`select public.set_shared_line('abcdefgh23', $1, 50)`, [ids.Soup]);
  expect(await lines("abcdefgh23")).toEqual({ [ids.Soup]: 20, [choice]: 1 });
  await db.query(`select public.set_shared_line('abcdefgh23', $1, 0)`, [ids.Soup]);
  expect(await lines("abcdefgh23")).toEqual({ [choice]: 1 });
  await expect(
    db.query(`select public.set_shared_line('abcdefgh23', $1, 1)`, [ids.Elsewhere]),
  ).rejects.toThrow(/unknown dish/);
});

it("ends after six hours, and can't be reached directly by visitors", async () => {
  await db.exec(`update public.shared_orders set expires_at = now() - interval '1 minute'`);
  expect(await lines("abcdefgh23")).toBeUndefined();
  await db.exec("set role anon");
  try {
    await expect(db.query("select * from public.get_shared_order('abcdefgh23')")).rejects.toThrow(
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});

describe("changing a line by how much", () => {
  const change = (code: string, line: string, by: number, id: string) =>
    db.query(`select public.change_shared_line($1, $2, $3, $4)`, [code, line, by, id]);

  it("counts both phones when two add the same dish at once", async () => {
    await db.query(`select public.create_shared_order($1, 'twophones2', $2::jsonb)`, [
      restaurant,
      JSON.stringify({ [ids.Soup]: 1 }),
    ]);
    await change("twophones2", ids.Soup, 1, "phoneaaaaaa2");
    await change("twophones2", ids.Soup, 1, "phonebbbbbb2");
    expect(await lines("twophones2")).toEqual({ [ids.Soup]: 3 });
  });

  it("ignores a retried change it has already counted", async () => {
    await change("twophones2", ids.Soup, 1, "phonebbbbbb2");
    expect(await lines("twophones2")).toEqual({ [ids.Soup]: 3 });
  });

  it("keeps each line between 0 and 20, and turns down bad changes", async () => {
    await change("twophones2", ids.Soup, 20, "phonecccccc2");
    expect(await lines("twophones2")).toEqual({ [ids.Soup]: 20 });
    await change("twophones2", ids.Soup, -20, "phonedddddd2");
    await change("twophones2", ids.Soup, -1, "phoneeeeeee2");
    expect(await lines("twophones2")).toEqual({});
    await expect(change("twophones2", ids.Soup, 1, "NOT AN ID")).rejects.toThrow(/invalid change/);
    await expect(change("twophones2", ids.Soup, 21, "phoneffffff2")).rejects.toThrow(
      /invalid change/,
    );
  });

  it("lets anyone take off a dish the owner unconfirmed, but not add more of it", async () => {
    await change("twophones2", ids.Soup, 2, "phonegggggg2");
    await db.exec(`update public.menu_items set confirmed = false where name = 'Soup'`);
    try {
      await expect(change("twophones2", ids.Soup, 1, "phonehhhhhh2")).rejects.toThrow(
        /unknown dish/,
      );
      await change("twophones2", ids.Soup, -1, "phonejjjjjj2");
      expect(await lines("twophones2")).toEqual({ [ids.Soup]: 1 });
      await db.query(`select public.set_shared_line('twophones2', $1, 0)`, [ids.Soup]);
      expect(await lines("twophones2")).toEqual({});
    } finally {
      await db.exec(`update public.menu_items set confirmed = true where name = 'Soup'`);
    }
  });

  it("is only for Carte's server", async () => {
    await db.exec("set role anon");
    try {
      await expect(change("twophones2", ids.Soup, 1, "phonekkkkkk2")).rejects.toThrow(
        /permission denied/,
      );
    } finally {
      await db.exec("reset role");
    }
  });
});
