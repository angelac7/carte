-- Return dish photos and restaurant cover photos in Discover search and trending results.
-- A function's return columns can't be changed in place, so each is dropped and recreated.

drop function public.search_dishes(text, int);
create function public.search_dishes(search text, result_limit int default 30)
returns table (
  dish_id uuid, dish_name text, description text, price text, allergens text[], dietary_tags text[],
  restaurant_name text, restaurant_slug text, city text, timezone text, hours jsonb, occasions text[],
  photo_url text
)
language sql stable security invoker set search_path = '' as $$
  select m.id, m.name, m.description, m.price, m.allergens, m.dietary_tags,
         r.name, r.slug, r.city, r.timezone, r.hours, r.occasions, m.photo_url
  from public.menu_items m
  join public.restaurants r on r.id = m.restaurant_id
  where m.confirmed and r.listed
    and to_tsvector('english', m.name || ' ' || m.description)
        @@ websearch_to_tsquery('english', search)
  order by ts_rank(to_tsvector('english', m.name || ' ' || m.description),
                   websearch_to_tsquery('english', search)) desc
  limit least(result_limit, 50);
$$;

drop function public.search_restaurants(text, int);
create function public.search_restaurants(search text, result_limit int default 30)
returns table (
  id uuid, name text, slug text, cuisine text, city text, address text, description text,
  timezone text, hours jsonb, occasions text[], cover_url text
)
language sql stable security invoker set search_path = '' as $$
  select r.id, r.name, r.slug, r.cuisine, r.city, r.address, r.description,
         r.timezone, r.hours, r.occasions,
         (select m.photo_url from public.menu_items m
           where m.restaurant_id = r.id and m.confirmed and m.photo_url is not null
           order by m.created_at limit 1)
  from public.restaurants r
  where r.listed
    and (coalesce(search, '') = ''
         or to_tsvector('english', r.name || ' ' || r.cuisine || ' ' || r.city || ' ' || r.description)
            @@ websearch_to_tsquery('english', search))
  order by r.name
  limit least(result_limit, 50);
$$;

drop function public.trending_dishes(int);
create function public.trending_dishes(result_limit int default 8)
returns table (
  dish_id uuid, dish_name text, price text, allergens text[], dietary_tags text[],
  restaurant_name text, restaurant_slug text, city text, views bigint, photo_url text
)
language sql stable security definer set search_path = '' as $$
  select m.id, m.name, m.price, m.allergens, m.dietary_tags, r.name, r.slug, r.city,
         sum(s.views), m.photo_url
  from public.dish_stats s
  join public.menu_items m on m.id = s.menu_item_id
  join public.restaurants r on r.id = m.restaurant_id
  where s.day > current_date - 7 and m.confirmed and r.listed
  group by m.id, r.id
  order by sum(s.views) desc
  limit least(result_limit, 20);
$$;
