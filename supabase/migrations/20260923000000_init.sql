-- Carte initial schema: restaurants, their dishes, and saved translations.

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  -- One restaurant per owner for now; multi-location support comes later.
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40),
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  description text not null default '',
  price text not null default '',
  allergens text[] not null default '{}'
    check (allergens <@ array['milk','eggs','fish','shellfish','tree nuts','peanuts','wheat','soy','sesame']::text[]),
  dietary_tags text[] not null default '{}'
    check (dietary_tags <@ array['vegan','vegetarian','gluten-free']::text[]),
  notes text not null default '' check (char_length(notes) <= 2000),
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_restaurant_id_idx on public.menu_items (restaurant_id);

create table public.translations (
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  language text not null check (language in ('es','zh','ko','ja','fr','vi')),
  source_hash text not null,
  name text not null default '',
  description text not null default '',
  notes text not null default '',
  primary key (menu_item_id, language)
);

-- Keep updated_at current on every edit.
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- Row Level Security: the database itself enforces who can see and change what.
alter table public.restaurants enable row level security;
alter table public.menu_items enable row level security;
alter table public.translations enable row level security;

-- Restaurants: anyone can see names and links; only owners change their own.
create policy "Restaurants are public" on public.restaurants
  for select using (true);
create policy "Owners create their restaurant" on public.restaurants
  for insert with check (owner_id = (select auth.uid()));
create policy "Owners update their restaurant" on public.restaurants
  for update using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "Owners delete their restaurant" on public.restaurants
  for delete using (owner_id = (select auth.uid()));

-- Dishes: diners see confirmed dishes only; owners manage their own restaurant's dishes.
create policy "Diners see confirmed dishes" on public.menu_items
  for select using (confirmed);
create policy "Owners see their dishes" on public.menu_items
  for select using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = (select auth.uid())));
create policy "Owners add dishes" on public.menu_items
  for insert with check (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = (select auth.uid())));
create policy "Owners update dishes" on public.menu_items
  for update using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = (select auth.uid())))
  with check (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = (select auth.uid())));
create policy "Owners delete dishes" on public.menu_items
  for delete using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = (select auth.uid())));

-- Translations: public for confirmed dishes; written only by the server using the secret key.
create policy "Translations of confirmed dishes are public" on public.translations
  for select using (exists (
    select 1 from public.menu_items m
    where m.id = menu_item_id and m.confirmed));
