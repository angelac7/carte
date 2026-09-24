-- Restaurant profiles for Discover, dish and restaurant search, and anonymous trending counts.

alter table public.restaurants
  add column listed boolean not null default false,
  add column description text not null default '' check (char_length(description) <= 500),
  add column cuisine text not null default '' check (char_length(cuisine) <= 60),
  add column city text not null default '' check (char_length(city) <= 80),
  add column address text not null default '' check (char_length(address) <= 200),
  add column timezone text not null default 'America/New_York',
  add column hours jsonb not null default '{}'::jsonb,
  add column occasions text[] not null default '{}'
    check (occasions <@ array['date-night','family','groups','quick-bite','business','late-night']::text[]);

create index menu_items_search_idx on public.menu_items
  using gin (to_tsvector('english', name || ' ' || description));

-- Confirmed dishes at listed restaurants. Runs as the visitor, so Row Level Security applies.
create function public.search_dishes(search text, result_limit int default 30)
returns table (
  dish_id uuid, dish_name text, description text, price text, allergens text[], dietary_tags text[],
  restaurant_name text, restaurant_slug text, city text, timezone text, hours jsonb, occasions text[]
)
language sql stable security invoker set search_path = '' as $$
  select m.id, m.name, m.description, m.price, m.allergens, m.dietary_tags,
         r.name, r.slug, r.city, r.timezone, r.hours, r.occasions
  from public.menu_items m
  join public.restaurants r on r.id = m.restaurant_id
  where m.confirmed and r.listed
    and to_tsvector('english', m.name || ' ' || m.description)
        @@ websearch_to_tsquery('english', search)
  order by ts_rank(to_tsvector('english', m.name || ' ' || m.description),
                   websearch_to_tsquery('english', search)) desc
  limit least(result_limit, 50);
$$;

-- Listed restaurants, optionally matching a search.
create function public.search_restaurants(search text, result_limit int default 30)
returns table (
  id uuid, name text, slug text, cuisine text, city text, address text, description text,
  timezone text, hours jsonb, occasions text[]
)
language sql stable security invoker set search_path = '' as $$
  select r.id, r.name, r.slug, r.cuisine, r.city, r.address, r.description,
         r.timezone, r.hours, r.occasions
  from public.restaurants r
  where r.listed
    and (coalesce(search, '') = ''
         or to_tsvector('english', r.name || ' ' || r.cuisine || ' ' || r.city || ' ' || r.description)
            @@ websearch_to_tsquery('english', search))
  order by r.name
  limit least(result_limit, 50);
$$;

-- Anonymous daily view counts. No personal data is stored.
create table public.dish_stats (
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0,
  primary key (menu_item_id, day)
);
alter table public.dish_stats enable row level security;
-- No policies: only the functions below read or write this table.

create function public.record_dish_view(item uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.dish_stats (menu_item_id, day, views)
  select m.id, current_date, 1 from public.menu_items m where m.id = item and m.confirmed
  on conflict (menu_item_id, day) do update set views = public.dish_stats.views + 1;
$$;
-- Only the server (using the secret key) may record views.
revoke execute on function public.record_dish_view(uuid) from public, anon, authenticated;

create function public.trending_dishes(result_limit int default 8)
returns table (
  dish_id uuid, dish_name text, price text, allergens text[], dietary_tags text[],
  restaurant_name text, restaurant_slug text, city text, views bigint
)
language sql stable security definer set search_path = '' as $$
  select m.id, m.name, m.price, m.allergens, m.dietary_tags, r.name, r.slug, r.city, sum(s.views)
  from public.dish_stats s
  join public.menu_items m on m.id = s.menu_item_id
  join public.restaurants r on r.id = m.restaurant_id
  where s.day > current_date - 7 and m.confirmed and r.listed
  group by m.id, r.id
  order by sum(s.views) desc
  limit least(result_limit, 20);
$$;
