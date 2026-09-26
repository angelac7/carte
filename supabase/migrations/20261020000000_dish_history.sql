-- A record of every change to a dish's allergen information, and every confirmation: who, when,
-- and what it said afterwards. Written only by the database, so the app can't skip or alter it.
create table public.dish_history (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  menu_item_id uuid not null,
  dish_name text not null,
  action text not null check (action in ('recorded', 'added', 'edited', 'confirmed', 'deleted')),
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now(),
  -- The allergen information after the change.
  safety jsonb not null
);
create index dish_history_restaurant_idx on public.dish_history (restaurant_id, changed_at desc);
create index dish_history_dish_idx on public.dish_history (menu_item_id, changed_at desc);

alter table public.dish_history enable row level security;
create policy "Owners and editors see the history" on public.dish_history
  for select using (public.can_edit_restaurant(restaurant_id));
revoke all on public.dish_history from anon, authenticated;
grant select on public.dish_history to authenticated;

-- The parts of a dish that are about allergies and diets.
create function public.dish_safety(item public.menu_items) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'allergens', item.allergens,
    'may_contain', item.may_contain,
    'removable', item.removable,
    'dietary_tags', item.dietary_tags,
    'allergen_list', item.allergen_list,
    'addon_allergens', coalesce((
      select jsonb_agg(jsonb_build_object('label', addon->>'label', 'allergens', addon->'allergens'))
      from jsonb_array_elements(item.addons) addon
      where jsonb_array_length(coalesce(addon->'allergens', '[]'::jsonb)) > 0), '[]'::jsonb));
$$;

create function public.record_dish_history() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.dish_history (restaurant_id, menu_item_id, dish_name, action, changed_by, safety)
    values (new.restaurant_id, new.id, new.name,
            case when new.confirmed then 'confirmed' else 'added' end,
            (select auth.uid()), public.dish_safety(new));
  elsif tg_op = 'DELETE' then
    -- When a whole restaurant is deleted, its history goes with it.
    if exists (select 1 from public.restaurants r where r.id = old.restaurant_id) then
      insert into public.dish_history (restaurant_id, menu_item_id, dish_name, action, changed_by, safety)
      values (old.restaurant_id, old.id, old.name, 'deleted', (select auth.uid()), public.dish_safety(old));
    end if;
  elsif new.confirmed and not old.confirmed then
    insert into public.dish_history (restaurant_id, menu_item_id, dish_name, action, changed_by, safety)
    values (new.restaurant_id, new.id, new.name, 'confirmed', (select auth.uid()), public.dish_safety(new));
  elsif public.dish_safety(new) is distinct from public.dish_safety(old) then
    insert into public.dish_history (restaurant_id, menu_item_id, dish_name, action, changed_by, safety)
    values (new.restaurant_id, new.id, new.name, 'edited', (select auth.uid()), public.dish_safety(new));
  end if;
  return null;
end;
$$;
revoke all on function public.record_dish_history() from public, anon, authenticated;

create trigger menu_items_history after insert or update or delete on public.menu_items
  for each row execute function public.record_dish_history();

-- Where each existing dish stands today, so there's something to go back to.
insert into public.dish_history (restaurant_id, menu_item_id, dish_name, action, safety)
select m.restaurant_id, m.id, m.name, 'recorded', public.dish_safety(m) from public.menu_items m;
