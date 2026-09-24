-- Enforce fresh review for every content edit, including direct database writes.
create function public.reset_dish_confirmation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.name, new.description, new.price, new.allergens, new.dietary_tags, new.notes, new.photo_url)
     is distinct from
     row(old.name, old.description, old.price, old.allergens, old.dietary_tags, old.notes, old.photo_url) then
    new.confirmed := false;
  end if;
  return new;
end;
$$;
create trigger menu_items_reset_confirmation before update on public.menu_items
  for each row execute function public.reset_dish_confirmation();

-- Match the diner opening-hours logic, including the previous day's overnight service.
create function public.restaurant_open_now(hours jsonb, zone text)
returns boolean language plpgsql stable set search_path = '' as $$
declare
  local_now timestamp;
  day_index int;
  day_keys text[] := array['mon','tue','wed','thu','fri','sat','sun'];
  today jsonb;
  yesterday jsonb;
  clock_time text;
begin
  if hours is null or hours = '{}'::jsonb then return false; end if;
  local_now := current_timestamp at time zone zone;
  day_index := extract(isodow from local_now)::int;
  today := hours -> day_keys[day_index];
  yesterday := hours -> day_keys[((day_index + 5) % 7) + 1];
  clock_time := to_char(local_now, 'HH24:MI');
  return coalesce(
    (case when today->>'close' <= today->>'open'
      then clock_time >= today->>'open'
      else clock_time >= today->>'open' and clock_time < today->>'close' end)
    or (yesterday->>'close' <= yesterday->>'open' and clock_time < yesterday->>'close'), false);
exception when invalid_parameter_value then
  return false;
end;
$$;

-- All filters run before LIMIT, for search and trending alike.
drop function public.search_dishes(text, int);
create function public.search_dishes(search text, result_limit int default 30, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false)
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
    and not (m.allergens && avoid)
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

drop function public.search_restaurants(text, int);
create function public.search_restaurants(search text, result_limit int default 30, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false)
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
    and exists (
      select 1 from public.menu_items m
      where m.restaurant_id = r.id and m.confirmed
        and not (m.allergens && avoid) and m.dietary_tags @> only_tags
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

drop function public.trending_dishes(int);
create function public.trending_dishes(result_limit int default 8, avoid text[] default '{}', only_tags text[] default '{}', filter_city text default '', filter_occasion text default '', open_only boolean default false)
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
    and not (m.allergens && avoid)
    and m.dietary_tags @> only_tags
    and (filter_city = '' or r.city = filter_city)
    and (filter_occasion = '' or filter_occasion = any(r.occasions))
    and (not open_only or public.restaurant_open_now(r.hours, r.timezone))
  group by m.id, r.id
  order by sum(s.views) desc
  limit least(result_limit, 20);
$$;
