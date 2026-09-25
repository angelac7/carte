-- Diners can tell a restaurant when a dish's details look wrong. Reports hold no personal data.
create table public.dish_reports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  -- Kept so the report still makes sense after the dish is renamed or deleted.
  dish_name text not null check (char_length(dish_name) between 1 and 300),
  kind text not null check (kind in ('allergens', 'diet', 'description', 'price', 'other')),
  message text not null default '' check (char_length(message) <= 500),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index dish_reports_open_idx on public.dish_reports (restaurant_id, resolved, created_at desc);

alter table public.dish_reports enable row level security;

-- Anyone may report a dish diners can see, and only as a new, open report.
create policy "Diners report confirmed dishes" on public.dish_reports
  for insert with check (
    not resolved
    and exists (
      select 1 from public.menu_items m
      where m.id = menu_item_id and m.restaurant_id = dish_reports.restaurant_id and m.confirmed));

create policy "Owners see their reports" on public.dish_reports
  for select using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = (select auth.uid())));

create policy "Owners resolve their reports" on public.dish_reports
  for update using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = (select auth.uid())))
  with check (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = (select auth.uid())));

-- Diners can only add reports; owners can only mark them resolved.
revoke all on public.dish_reports from anon, authenticated;
grant insert (restaurant_id, menu_item_id, dish_name, kind, message) on public.dish_reports
  to anon, authenticated;
grant select on public.dish_reports to authenticated;
grant update (resolved) on public.dish_reports to authenticated;
