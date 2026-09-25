-- Carte now covers the EU's 14 major allergens: the 9 US ones plus celery, mustard, lupin,
-- mollusks, and sulfites. The list matches lib/allergens.ts; update both together.
alter table public.menu_items drop constraint menu_items_allergens_check;
alter table public.menu_items add constraint menu_items_allergens_check check (allergens <@ array[
  'milk','eggs','fish','shellfish','tree nuts','peanuts','wheat','soy','sesame',
  'celery','mustard','lupin','mollusks','sulfites']::text[]);

-- Which list the owner checked when confirming: 1 is the original 9, 2 is all 14.
-- Dishes confirmed before this change stay at 1 until the owner checks the newer five.
alter table public.menu_items
  add column allergen_list smallint not null default 1 check (allergen_list in (1, 2));

-- A dish checked only for the original 9 can't be vouched for to a diner avoiding a newer one.
create function public.unchecked_for(dish_list smallint, avoid text[]) returns boolean
language sql immutable set search_path = '' as $$
  select dish_list < 2 and avoid && array['celery','mustard','lupin','mollusks','sulfites']::text[];
$$;

create or replace function public.valid_addons(addons jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(addons) = 'array'
    and jsonb_array_length(addons) <= 12
    and not exists (
      select 1 from jsonb_array_elements(addons) addon
      where jsonb_typeof(addon -> 'allergens') <> 'array'
         or exists (
           select 1 from jsonb_array_elements_text(addon -> 'allergens') allergen
           where allergen not in ('milk','eggs','fish','shellfish','tree nuts','peanuts','wheat',
             'soy','sesame','celery','mustard','lupin','mollusks','sulfites')));
$$;

-- Discover applies the same rule, and says which list each dish was checked against.
drop function public.search_dishes(text, int, text[], text[], text, text, boolean);
create function public.search_dishes(search text, result_limit int default 30, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false)
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
  where m.confirmed and r.listed
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

drop function public.trending_dishes(int, text[], text[], text, text, boolean);
create function public.trending_dishes(result_limit int default 8, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false)
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
  where s.day > current_date - 7 and m.confirmed and r.listed
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
  where r.listed
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
