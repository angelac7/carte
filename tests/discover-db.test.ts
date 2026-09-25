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

it("rejects stale dish updates and stale whole-menu deletion snapshots", async () => {
  const {
    rows: [restaurant],
  } = await db.query<{ id: string; owner_id: string }>(
    "select id, owner_id from restaurants where slug = 'restaurant-43'",
  );
  await db.exec(
    `create or replace function auth.uid() returns uuid language sql as 'select ''${restaurant.owner_id}''::uuid'`,
  );
  try {
    const {
      rows: [dish],
    } = await db.query<{ id: string; revision: number }>(
      "insert into menu_items (restaurant_id, name) values ($1, 'Original') returning id, revision",
      [restaurant.id],
    );
    await db.query("update menu_items set name = 'First tab' where id = $1 and revision = $2", [
      dish.id,
      dish.revision,
    ]);
    const stale = await db.query(
      "update menu_items set name = 'Stale tab' where id = $1 and revision = $2 returning id",
      [dish.id, dish.revision],
    );
    expect(stale.rows).toHaveLength(0);
    await expect(
      db.query("select * from delete_menu_snapshot($1, $2::jsonb)", [
        restaurant.id,
        JSON.stringify([dish]),
      ]),
    ).rejects.toThrow(/Menu changed/);
    const { rows: current } = await db.query(
      "select id, revision from menu_items where restaurant_id = $1",
      [restaurant.id],
    );
    await db.query("select * from delete_menu_snapshot($1, $2::jsonb)", [
      restaurant.id,
      JSON.stringify(current),
    ]);
    expect(
      (await db.query("select id from menu_items where restaurant_id = $1", [restaurant.id])).rows,
    ).toHaveLength(0);
  } finally {
    await db.exec(
      "create or replace function auth.uid() returns uuid language sql as 'select null::uuid'",
    );
  }
});

it("requires independent admin review, detects stale decisions, and explicitly handles disputed claims", async () => {
  const { rows: owners } = await db.query<{ id: string; owner_id: string }>(
    "select id, owner_id from restaurants where slug in ('restaurant-42','restaurant-43') order by slug",
  );
  const [first, second] = owners;
  const {
    rows: [admin],
  } = await db.query<{ id: string }>(
    "insert into auth.users values (gen_random_uuid()) returning id",
  );
  await db.query("insert into carte_admins(user_id) values ($1)", [admin.id]);
  const login = (id: string) =>
    db.exec(
      `create or replace function auth.uid() returns uuid language sql as 'select ''${id}''::uuid'`,
    );
  try {
    await login(first.owner_id);
    const {
      rows: [submitted],
    } = await db.query<{ id: string }>(
      "select submit_place_claim($1, 'node-987654', 'I operate this restaurant; verify using its published business telephone.') as id",
      [first.id],
    );
    await expect(
      db.query(
        "select review_place_claim($1, 1, 'approved', 'I called the independently listed restaurant telephone.', false)",
        [submitted.id],
      ),
    ).rejects.toThrow(/Not authorized/);
    await db.query("insert into carte_admins(user_id) values ($1)", [first.owner_id]);
    await expect(
      db.query(
        "select review_place_claim($1, 1, 'approved', 'I called the independently listed restaurant telephone.', false)",
        [submitted.id],
      ),
    ).rejects.toThrow(/Another administrator/);
    await login(admin.id);
    await db.query(
      "select review_place_claim($1, 1, 'approved', 'I called the independently listed restaurant telephone.', false)",
      [submitted.id],
    );
    await expect(
      db.query(
        "select review_place_claim($1, 1, 'rejected', 'Old tab must not override a completed approval.', false)",
        [submitted.id],
      ),
    ).rejects.toThrow(/Claim changed/);
    await login(second.owner_id);
    const {
      rows: [dispute],
    } = await db.query<{ id: string }>(
      "select submit_place_claim($1, 'node-987654', 'This listing is ours; please independently investigate ownership.') as id",
      [second.id],
    );
    expect(
      (
        await db.query<{ osm_verified: boolean }>(
          "select osm_verified from restaurants where id = $1",
          [first.id],
        )
      ).rows[0].osm_verified,
    ).toBe(true);
    await login(admin.id);
    await expect(
      db.query(
        "select review_place_claim($1, 1, 'approved', 'Verified a change of ownership through independent contact.', false)",
        [dispute.id],
      ),
    ).rejects.toThrow(/Explicit transfer/);
    await db.query(
      "select review_place_claim($1, 1, 'approved', 'Verified a change of ownership through independent contact.', true)",
      [dispute.id],
    );
    expect(
      (
        await db.query<{ osm_id: string | null }>("select osm_id from restaurants where id = $1", [
          first.id,
        ])
      ).rows[0].osm_id,
    ).toBeNull();
    expect(
      (
        await db.query<{ osm_verified: boolean }>(
          "select osm_verified from restaurants where id = $1",
          [second.id],
        )
      ).rows[0].osm_verified,
    ).toBe(true);
    expect(
      (await db.query("select id from claim_events where action = 'transferred'")).rows,
    ).toHaveLength(1);
    const {
      rows: [permissions],
    } = await db.query<{ edit_admin: boolean; verify: boolean; edit_claim: boolean }>(
      "select has_table_privilege('authenticated','carte_admins','INSERT') as edit_admin, has_column_privilege('authenticated','restaurants','osm_verified','UPDATE') as verify, has_table_privilege('authenticated','place_claims','UPDATE') as edit_claim",
    );
    expect(permissions).toEqual({ edit_admin: false, verify: false, edit_claim: false });
  } finally {
    await db.exec(
      "create or replace function auth.uid() returns uuid language sql as 'select null::uuid'",
    );
  }
});

it("requires review when a source language is corrected", async () => {
  const {
    rows: [dish],
  } = await db.query<{ id: string }>("select id from menu_items limit 1");
  await db.query("update menu_items set confirmed = true where id = $1", [dish.id]);
  const {
    rows: [changed],
  } = await db.query<{ confirmed: boolean; revision: number }>(
    "update menu_items set source_language = 'ja', confirmed = true where id = $1 returning confirmed, revision",
    [dish.id],
  );
  expect(changed.confirmed).toBe(false);
});

describe("Discover and the newer allergens", () => {
  it("hides dishes never checked for a newer allergen the diner avoids", async () => {
    await db.exec(`
      insert into auth.users values ('00000000-0000-0000-0000-00000000c0de');
      insert into public.restaurants (owner_id, name, slug, listed)
        values ('00000000-0000-0000-0000-00000000c0de', 'Checked', 'checked-for-14', true);
      insert into public.menu_items (restaurant_id, name, confirmed, allergen_list)
        select id, 'Salad', true, 2 from public.restaurants where slug = 'checked-for-14';
    `);
    const result = await db.query<{ restaurant_slug: string; allergen_list: number }>(
      `select * from public.search_dishes('salad', avoid => array['mustard'])`,
    );
    expect(result.rows.map((row) => row.restaurant_slug)).toEqual(["checked-for-14"]);
    expect(result.rows[0].allergen_list).toBe(2);
    await db.exec(`update public.menu_items set allergens = array['mustard', 'celery']
      where restaurant_id = (select id from public.restaurants where slug = 'checked-for-14')`);
    const avoided = await db.query(
      `select * from public.search_dishes('salad', avoid => array['mustard'])`,
    );
    expect(avoided.rows).toEqual([]);
  });
});
