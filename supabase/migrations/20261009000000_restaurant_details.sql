-- Contact details, price range, and the restaurant's own logo and cover photo.
alter table public.restaurants
  add column phone text not null default '' check (char_length(phone) <= 40),
  add column website text not null default ''
    check (website = '' or (website ~ '^https?://' and char_length(website) <= 300)),
  add column reservation_url text not null default ''
    check (reservation_url = '' or (reservation_url ~ '^https?://' and char_length(reservation_url) <= 300)),
  -- 0 means not set; otherwise 1 to 4, shown as $ to $$$$.
  add column price_range smallint not null default 0 check (price_range between 0 and 4),
  add column logo_url text,
  add column cover_url text,
  -- Images may only point at this restaurant's own folder, like dish photos.
  add constraint restaurants_own_images check (
    (logo_url is null or logo_url ~ (
      '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/dish-photos/'
      || id::text || '/restaurant-logo-[0-9]+\.(jpg|png|webp)$'))
    and (cover_url is null or cover_url ~ (
      '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/dish-photos/'
      || id::text || '/restaurant-cover-[0-9]+\.(jpg|png|webp)$')));

grant update (phone, website, reservation_url, price_range, logo_url, cover_url)
  on public.restaurants to authenticated;

-- Discover shows the restaurant's own cover photo, or a dish photo when it has none.
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
