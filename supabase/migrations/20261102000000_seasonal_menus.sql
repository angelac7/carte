-- Seasonal menus, like brunch or a holiday menu: named groups of dishes an owner switches on and
-- off together. While a group is off, its dishes are hidden from diners but keep their
-- confirmation, so switching it back on needs no re-checking.
create table public.dish_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index dish_groups_restaurant on public.dish_groups (restaurant_id);
alter table public.dish_groups enable row level security;
create policy "Owners and editors see their seasonal menus" on public.dish_groups
  for select using (public.can_edit_restaurant(restaurant_id));
create policy "Owners and editors add seasonal menus" on public.dish_groups
  for insert with check (public.can_edit_restaurant(restaurant_id));
create policy "Owners and editors change seasonal menus" on public.dish_groups
  for update using (public.can_edit_restaurant(restaurant_id))
  with check (public.can_edit_restaurant(restaurant_id));
create policy "Owners and editors remove seasonal menus" on public.dish_groups
  for delete using (public.can_edit_restaurant(restaurant_id));
revoke all on public.dish_groups from anon;

-- Which group a dish belongs to, and whether that group is on. in_season is kept in step by the
-- triggers below, so every place diners see dishes needs only one simple check.
alter table public.menu_items
  add column group_id uuid references public.dish_groups (id) on delete set null,
  add column in_season boolean not null default true;
create index menu_items_group on public.menu_items (group_id) where group_id is not null;

create function public.set_dish_season() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.group_id is null then
    new.in_season := true;
  else
    select g.active into new.in_season from public.dish_groups g
    where g.id = new.group_id and g.restaurant_id = new.restaurant_id;
    if not found then raise exception 'unknown seasonal menu' using errcode = '22023'; end if;
  end if;
  return new;
end;
$$;
revoke all on function public.set_dish_season() from public, anon, authenticated;
create trigger menu_items_season before insert or update on public.menu_items
  for each row execute function public.set_dish_season();

create function public.apply_group_season() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.active is distinct from old.active then
    update public.menu_items m set in_season = new.active where m.group_id = new.id;
  end if;
  return null;
end;
$$;
revoke all on function public.apply_group_season() from public, anon, authenticated;
create trigger dish_groups_season after update on public.dish_groups
  for each row execute function public.apply_group_season();

-- A dish from a menu that's switched off can't be added to a shared table order.
create or replace function public.shared_line_ok(restaurant uuid, line text) returns boolean
language sql stable security definer set search_path = '' as $$
  select line ~ '^[0-9a-f-]{36}(\|[0-9]*\|[0-9.]*)?$'
    and exists (
      select 1 from public.menu_items m
      where m.id = split_part(line, '|', 1)::uuid and m.restaurant_id = restaurant
        and m.confirmed and m.in_season);
$$;

-- Discover leaves out dishes from menus that are switched off.
create or replace function public.search_dishes(search text, result_limit int default 30, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false, with_features text[] default '{}')
returns table (
  dish_id uuid, dish_name text, description text, price text, allergens text[], dietary_tags text[],
  restaurant_name text, restaurant_slug text, city text, timezone text, hours jsonb, occasions text[],
  photo_url text, allergen_list smallint
)
language sql stable security invoker set search_path = '' as $$
  select m.id, m.name, m.description, m.price, m.allergens, m.dietary_tags,
         r.name, r.slug, r.city, r.timezone, r.hours, r.occasions, m.photo_url, m.allergen_list
  from public.menu_items m
  join public.restaurants r on r.id = m.restaurant_id
  where m.confirmed and m.in_season and r.listed and not r.suspended
    and not (m.allergens && avoid)
    and not public.unchecked_for(m.allergen_list, avoid)
    and m.dietary_tags @> only_tags
    and r.features @> with_features
    and (filter_city = '' or r.city = filter_city)
    and (filter_occasion = '' or filter_occasion = any(r.occasions))
    and (not open_only or public.restaurant_open_now(r.hours, r.timezone))
    and to_tsvector('english', m.name || ' ' || m.description)
        @@ websearch_to_tsquery('english', search)
  order by ts_rank(to_tsvector('english', m.name || ' ' || m.description),
                   websearch_to_tsquery('english', search)) desc
  limit least(result_limit, 50);
$$;

create or replace function public.trending_dishes(result_limit int default 8, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false, with_features text[] default '{}')
returns table (
  dish_id uuid, dish_name text, price text, allergens text[], dietary_tags text[],
  restaurant_name text, restaurant_slug text, city text, views bigint, photo_url text,
  allergen_list smallint
)
language sql stable security definer set search_path = '' as $$
  select m.id, m.name, m.price, m.allergens, m.dietary_tags, r.name, r.slug, r.city,
         sum(s.views), m.photo_url, m.allergen_list
  from public.dish_stats s
  join public.menu_items m on m.id = s.menu_item_id
  join public.restaurants r on r.id = m.restaurant_id
  where s.day > current_date - 7 and m.confirmed and m.in_season and r.listed and not r.suspended
    and not (m.allergens && avoid)
    and not public.unchecked_for(m.allergen_list, avoid)
    and m.dietary_tags @> only_tags
    and r.features @> with_features
    and (filter_city = '' or r.city = filter_city)
    and (filter_occasion = '' or filter_occasion = any(r.occasions))
    and (not open_only or public.restaurant_open_now(r.hours, r.timezone))
  group by m.id, r.id
  order by sum(s.views) desc
  limit least(result_limit, 20);
$$;

create or replace function public.search_restaurants(search text, result_limit int default 30, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false, with_features text[] default '{}')
returns table (
  id uuid, name text, slug text, cuisine text, city text, address text, description text,
  timezone text, hours jsonb, occasions text[], cover_url text, features text[]
)
language sql stable security invoker set search_path = '' as $$
  select r.id, r.name, r.slug, r.cuisine, r.city, r.address, r.description,
         r.timezone, r.hours, r.occasions,
         coalesce(r.cover_url, (select m.photo_url from public.menu_items m
           where m.restaurant_id = r.id and m.confirmed and m.in_season and m.photo_url is not null
           order by m.sort_order, m.created_at limit 1)),
         r.features
  from public.restaurants r
  where r.listed and not r.suspended
    and r.features @> with_features
    and exists (
      select 1 from public.menu_items m
      where m.restaurant_id = r.id and m.confirmed and m.in_season
        and not (m.allergens && avoid)
        and not public.unchecked_for(m.allergen_list, avoid)
        and m.dietary_tags @> only_tags
    )
    and (filter_city = '' or r.city = filter_city)
    and (filter_occasion = '' or filter_occasion = any(r.occasions))
    and (not open_only or public.restaurant_open_now(r.hours, r.timezone))
    and (coalesce(search, '') = ''
         or to_tsvector('english', r.name || ' ' || r.cuisine || ' ' || r.city || ' ' || r.description)
            @@ websearch_to_tsquery('english', search))
  order by r.name
  limit least(result_limit, 50);
$$;
