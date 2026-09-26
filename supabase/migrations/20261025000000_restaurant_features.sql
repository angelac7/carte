-- Accessibility and family facts about a restaurant, from a fixed list with checked
-- translations. Diners can see them on the menu and find restaurants with them on Discover.
alter table public.restaurants
  add column features text[] not null default '{}'
  check (features <@ array['wheelchair-access', 'step-free-entry', 'accessible-restroom',
    'high-chairs', 'changing-table', 'quiet']::text[]);

-- Discover can now ask for restaurants with every chosen feature. The new argument is optional,
-- so earlier callers keep working.
drop function public.search_dishes(text, int, text[], text[], text, text, boolean);
drop function public.trending_dishes(int, text[], text[], text, text, boolean);
drop function public.search_restaurants(text, int, text[], text[], text, text, boolean);

create function public.search_dishes(search text, result_limit int default 30, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false, with_features text[] default '{}')
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

create function public.trending_dishes(result_limit int default 8, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false, with_features text[] default '{}')
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
    and r.features @> with_features
    and (filter_city = '' or r.city = filter_city)
    and (filter_occasion = '' or filter_occasion = any(r.occasions))
    and (not open_only or public.restaurant_open_now(r.hours, r.timezone))
  group by m.id, r.id
  order by sum(s.views) desc
  limit least(result_limit, 20);
$$;

create function public.search_restaurants(search text, result_limit int default 30, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false, with_features text[] default '{}')
returns table (
  id uuid, name text, slug text, cuisine text, city text, address text, description text,
  timezone text, hours jsonb, occasions text[], cover_url text, features text[]
)
language sql stable security invoker set search_path = '' as $$
  select r.id, r.name, r.slug, r.cuisine, r.city, r.address, r.description,
         r.timezone, r.hours, r.occasions,
         coalesce(r.cover_url, (select m.photo_url from public.menu_items m
           where m.restaurant_id = r.id and m.confirmed and m.photo_url is not null
           order by m.sort_order, m.created_at limit 1)),
         r.features
  from public.restaurants r
  where r.listed and not r.suspended
    and r.features @> with_features
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
