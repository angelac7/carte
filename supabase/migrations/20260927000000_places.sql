-- Link Carte restaurants to real OpenStreetMap listings, and cache map lookups.

alter table public.restaurants
  add column osm_id text unique check (osm_id ~ '^(node|way|relation)-[0-9]+$'),
  add column osm_verified boolean not null default false;

-- Changing the linked listing always needs fresh approval.
create function public.reset_osm_verification() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.osm_id is distinct from old.osm_id then
    new.osm_verified := false;
  end if;
  return new;
end;
$$;

create trigger restaurants_reset_osm_verification
  before update on public.restaurants
  for each row execute function public.reset_osm_verification();

-- Owners can edit their own restaurant, but never approve their own claim.
revoke insert, update on public.restaurants from anon, authenticated;
grant insert (owner_id, name, slug) on public.restaurants to authenticated;
grant update (name, slug, listed, description, cuisine, city, address, timezone, hours, occasions, osm_id)
  on public.restaurants to authenticated;

-- Saved OpenStreetMap results, so repeated searches don't hit their servers again.
create table public.place_cache (
  key text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.place_cache enable row level security;
-- No policies: only the server (using the secret key) reads or writes this table.
