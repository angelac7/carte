-- Tools for Carte's own administrators: an overview of every restaurant, and suspending a menu
-- that breaks the rules. Owners can't change "suspended":
-- it isn't among the columns they may update.
alter table public.restaurants add column suspended boolean not null default false;

-- Every restaurant with its menu and report counts, for administrators only.
create function public.admin_restaurants(page_offset int default 0)
returns table (
  id uuid, name text, slug text, listed boolean, suspended boolean, created_at timestamptz,
  dishes bigint, confirmed bigint, open_reports bigint
)
language sql stable security definer set search_path = '' as $$
  select r.id, r.name, r.slug, r.listed, r.suspended, r.created_at,
         (select count(*) from public.menu_items m where m.restaurant_id = r.id),
         (select count(*) from public.menu_items m where m.restaurant_id = r.id and m.confirmed),
         (select count(*) from public.dish_reports d where d.restaurant_id = r.id and not d.resolved)
  from public.restaurants r
  where public.is_carte_admin()
  order by r.created_at desc
  limit 100 offset greatest(page_offset, 0);
$$;

-- Suspends a restaurant's menu everywhere diners look, or restores it.
create function public.admin_moderate(restaurant uuid, suspend boolean)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_carte_admin() then
    raise exception 'Administrators only.' using errcode = '42501';
  end if;
  update public.restaurants set suspended = suspend where id = restaurant;
end;
$$;

revoke all on function public.admin_restaurants(int) from public, anon;
revoke all on function public.admin_moderate(uuid, boolean) from public, anon;
grant execute on function public.admin_restaurants(int) to authenticated;
grant execute on function public.admin_moderate(uuid, boolean) to authenticated;

-- Suspended restaurants disappear from Discover.
create or replace function public.search_dishes(search text, result_limit int default 30, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false)
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
  where m.confirmed and r.listed and not r.suspended
    and not (m.allergens && avoid)
    and not public.unchecked_for(m.allergen_list, avoid)
    and m.dietary_tags @> only_tags
    and (filter_city = '' or r.city = filter_city)
    and (filter_occasion = '' or filter_occasion = any(r.occasions))
    and (not open_only or public.restaurant_open_now(r.hours, r.timezone))
    and to_tsvector('english', m.name || ' ' || m.description)
        @@ websearch_to_tsquery('english', search)
  order by ts_rank(to_tsvector('english', m.name || ' ' || m.description),
                   websearch_to_tsquery('english', search)) desc
  limit least(result_limit, 50);
$$;

create or replace function public.trending_dishes(result_limit int default 8, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false)
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
  where s.day > current_date - 7 and m.confirmed and r.listed and not r.suspended
    and not (m.allergens && avoid)
    and not public.unchecked_for(m.allergen_list, avoid)
    and m.dietary_tags @> only_tags
    and (filter_city = '' or r.city = filter_city)
    and (filter_occasion = '' or filter_occasion = any(r.occasions))
    and (not open_only or public.restaurant_open_now(r.hours, r.timezone))
  group by m.id, r.id
  order by sum(s.views) desc
  limit least(result_limit, 20);
$$;

create or replace function public.search_restaurants(search text, result_limit int default 30, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false)
returns table (
  id uuid, name text, slug text, cuisine text, city text, address text, description text,
  timezone text, hours jsonb, occasions text[], cover_url text
)
language sql stable security invoker set search_path = '' as $$
  select r.id, r.name, r.slug, r.cuisine, r.city, r.address, r.description,
         r.timezone, r.hours, r.occasions,
         coalesce(r.cover_url, (select m.photo_url from public.menu_items m
           where m.restaurant_id = r.id and m.confirmed and m.photo_url is not null
           order by m.sort_order, m.created_at limit 1))
  from public.restaurants r
  where r.listed and not r.suspended
    and exists (
      select 1 from public.menu_items m
      where m.restaurant_id = r.id and m.confirmed
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
