import { readFileSync, readdirSync } from "node:fs";
import { isOpenNow, WEEKDAYS, type WeeklyHours } from "@/lib/restaurant-profile";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as 'select null::uuid';
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  `);
  for (const file of readdirSync("supabase/migrations")
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  await db.exec(`
    insert into auth.users select gen_random_uuid() from generate_series(1, 43);
    insert into public.restaurants (owner_id, name, slug, listed, city, occasions, hours)
    select id, 'Restaurant ' || n, 'restaurant-' || n, true,
      case when n = 41 then 'Target' else 'Elsewhere' end,
      case when n = 41 then array['family'] else '{}'::text[] end,
      case when n = 41 then '{"mon":{"open":"00:00","close":"00:00"},"tue":{"open":"00:00","close":"00:00"},"wed":{"open":"00:00","close":"00:00"},"thu":{"open":"00:00","close":"00:00"},"fri":{"open":"00:00","close":"00:00"},"sat":{"open":"00:00","close":"00:00"},"sun":{"open":"00:00","close":"00:00"}}'::jsonb else '{}'::jsonb end
    from (select id, row_number() over () as n from auth.users) owners;
    insert into public.menu_items (restaurant_id, name, confirmed, allergens, dietary_tags)
    select id, 'Salad', slug <> 'restaurant-42',
      case when slug = 'restaurant-41' then '{}'::text[] else array['peanuts'] end,
      case when slug = 'restaurant-41' then array['vegan'] else '{}'::text[] end
    from public.restaurants where slug <> 'restaurant-43';
    insert into public.dish_stats (menu_item_id, views)
    select m.id, case when r.slug = 'restaurant-41' then 1 else 100 end
    from public.menu_items m join public.restaurants r on r.id = m.restaurant_id;
  `);
}, 30000);
afterAll(async () => {
  await db?.close();
});

const filters = `avoid => array['peanuts'], only_tags => array['vegan'], filter_city => 'Target', filter_occasion => 'family', open_only => true`;

describe("Discover database filtering", () => {
  it("filters dishes before applying the result limit", async () => {
    const result = await db.query<{ restaurant_slug: string }>(
      `select * from public.search_dishes('salad', result_limit => 1, ${filters})`,
    );
    expect(result.rows.map((row) => row.restaurant_slug)).toEqual(["restaurant-41"]);
  });
  it("filters trending before applying its result limit", async () => {
    const result = await db.query<{ restaurant_slug: string }>(
      `select * from public.trending_dishes(result_limit => 1, ${filters})`,
    );
    expect(result.rows.map((row) => row.restaurant_slug)).toEqual(["restaurant-41"]);
  });
  it("requires a matching confirmed dish for restaurant results", async () => {
    const result = await db.query<{ slug: string }>(
      `select * from public.search_restaurants('', result_limit => 1, ${filters})`,
    );
    expect(result.rows.map((row) => row.slug)).toEqual(["restaurant-41"]);
    const all = await db.query<{ slug: string }>(
      "select * from public.search_restaurants('', result_limit => 50)",
    );
    expect(all.rows.map((row) => row.slug)).not.toContain("restaurant-42");
    expect(all.rows.map((row) => row.slug)).not.toContain("restaurant-43");
  });
  it("does not ignore any place filter on trending", async () => {
    for (const filter of ["filter_city => 'Missing'", "filter_occasion => 'date-night'"]) {
      const result = await db.query(`select * from public.trending_dishes(${filter})`);
      expect(result.rows).toHaveLength(0);
    }
    const result = await db.query<{ restaurant_slug: string }>(
      `select * from public.trending_dishes(open_only => true)`,
    );
    expect(result.rows.map((row) => row.restaurant_slug)).toEqual(["restaurant-41"]);
  });
});

it("unconfirms every content edit even when the writer supplies confirmed=true", async () => {
  const { rows } = await db.query<{ id: string }>("select id from public.menu_items limit 1");
  const id = rows[0].id;
  for (const edit of [
    "name = 'Changed'",
    "description = 'New description'",
    "price = '$12'",
    "allergens = array['milk']",
    "dietary_tags = array['vegetarian']",
    "notes = 'Shared fryer'",
    "photo_url = 'https://test.supabase.co/storage/v1/object/public/dish-photos/' || restaurant_id::text || '/' || id::text || '-1.jpg'",
  ]) {
    await db.query("update public.menu_items set confirmed = true where id = $1", [id]);
    const updated = await db.query<{ confirmed: boolean }>(
      `update public.menu_items set ${edit}, confirmed = true where id = $1 returning confirmed`,
      [id],
    );
    expect(updated.rows[0].confirmed).toBe(false);
  }
  const confirmed = await db.query<{ confirmed: boolean }>(
    "update public.menu_items set confirmed = true where id = $1 returning confirmed",
    [id],
  );
  expect(confirmed.rows[0].confirmed).toBe(true);
});

it("keeps SQL opening-hours filtering consistent with diner badges", async () => {
  const schedules: WeeklyHours[] = [
    {},
    Object.fromEntries(WEEKDAYS.map((day) => [day, null])),
    Object.fromEntries(WEEKDAYS.map((day) => [day, { open: "11:00", close: "21:00" }])),
    Object.fromEntries(WEEKDAYS.map((day) => [day, { open: "22:00", close: "02:00" }])),
    Object.fromEntries(WEEKDAYS.map((day) => [day, { open: "00:00", close: "00:00" }])),
    { mon: { open: "22:00", close: "02:00" }, tue: null },
  ];
  for (const zone of ["America/New_York", "Asia/Tokyo", "Europe/Paris", "invalid"]) {
    for (const hours of schedules) {
      const { rows } = await db.query<{ open: boolean; now: Date }>(
        "select public.restaurant_open_now($1::jsonb, $2) as open, current_timestamp as now",
        [JSON.stringify(hours), zone],
      );
      expect(rows[0].open).toBe(isOpenNow(hours, zone, new Date(rows[0].now)) === true);
    }
  }
});

it("atomically enforces shared limits and resets expired windows", async () => {
  const key = "a".repeat(64);
  const attempts = await Promise.all(
    Array.from({ length: 8 }, () =>
      db.query<{ allowed: boolean }>("select public.consume_rate_limit($1, 3, 60000) as allowed", [
        key,
      ]),
    ),
  );
  expect(attempts.filter((result) => result.rows[0].allowed)).toHaveLength(3);
  await db.query(
    "update public.rate_limits set expires_at = now() - interval '1 second' where key_hash = $1",
    [key],
  );
  expect(
    (
      await db.query<{ allowed: boolean }>(
        "select public.consume_rate_limit($1, 3, 60000) as allowed",
        [key],
      )
    ).rows[0].allowed,
  ).toBe(true);
});
it("rejects cross-restaurant photo references at the database boundary", async () => {
  await expect(
    db.exec(
      "update public.menu_items set photo_url = 'https://test.supabase.co/storage/v1/object/public/dish-photos/other/dish-1.jpg' where id = (select id from public.menu_items limit 1)",
    ),
  ).rejects.toThrow();
});
