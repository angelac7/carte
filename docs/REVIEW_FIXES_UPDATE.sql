-- Run once in Supabase SQL Editor for the existing Carte project.
-- Requires the existing migrations through 20261026000000_menu_currency.sql.
-- Adds atomic spreadsheet imports and menu review reminders.
-- Does not remove restaurants, menus, accounts, or existing review history.
begin;

-- 20261027000000_atomic_menu_import.sql
-- A preview is an immutable, short-lived plan owned by the person who requested it.
create table public.menu_imports (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 actor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 snapshot jsonb not null check (jsonb_typeof(snapshot) = 'array'),
 payload jsonb not null check (jsonb_typeof(payload) = 'object'),
 expires_at timestamptz not null default now() + interval '30 minutes',
 applied_at timestamptz
);
alter table public.menu_imports enable row level security;
create policy "Editors create their own import previews" on public.menu_imports for insert to authenticated
 with check (actor_id = auth.uid() and public.can_edit_restaurant(restaurant_id));
create policy "Editors read their own import previews" on public.menu_imports for select to authenticated
 using (actor_id = auth.uid() and public.can_edit_restaurant(restaurant_id));
revoke all on public.menu_imports from anon, authenticated;
grant select on public.menu_imports to authenticated;
grant insert (restaurant_id, snapshot, payload) on public.menu_imports to authenticated;

create function public.apply_menu_import(preview uuid, restaurant uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare job public.menu_imports; actual jsonb; row_data jsonb; item public.menu_items; position integer;
begin
 if auth.uid() is null or not public.can_edit_restaurant(restaurant) then
   raise exception 'Not authorized' using errcode = '42501';
 end if;
 -- Serialize the same receipt. A lost response can be retried without repeating any writes.
 select * into job from public.menu_imports where id = preview and restaurant_id = restaurant and actor_id = auth.uid() for update;
 if not found then raise exception 'Preview not found' using errcode = '22023'; end if;
 if job.applied_at is not null then return job.payload->'summary'; end if;
 if job.expires_at < now() then raise exception 'Preview expired' using errcode = '40001'; end if;
 perform 1 from public.restaurants where id = restaurant for update;
 perform 1 from public.menu_items where restaurant_id = restaurant for update;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'revision',revision) order by id),'[]'::jsonb)
 into actual from public.menu_items where restaurant_id = restaurant;
 if actual is distinct from (select coalesce(jsonb_agg(value order by value->>'id'),'[]'::jsonb) from jsonb_array_elements(job.snapshot)) then
   raise exception 'Menu changed since preview' using errcode = '40001';
 end if;
 if jsonb_typeof(job.payload->'add') is distinct from 'array' or jsonb_typeof(job.payload->'change') is distinct from 'array'
    or jsonb_array_length(job.payload->'add') + jsonb_array_length(job.payload->'change') > 1000 then
   raise exception 'Invalid import' using errcode = '22023';
 end if;
 select coalesce(max(sort_order),0) into position from public.menu_items where restaurant_id = restaurant;
 for row_data in select value from jsonb_array_elements(job.payload->'add') loop
   item := jsonb_populate_record(null::public.menu_items, row_data);
   position := position + 1;
   insert into public.menu_items(restaurant_id, name, description, price, section, calories, spice, allergens, removable, may_contain, also_contains, dietary_tags, notes, special, confirmed, source_language, sort_order)
   values(restaurant, item.name, coalesce(item.description,''), coalesce(item.price,''), coalesce(item.section,''), item.calories, item.spice,
     coalesce(item.allergens,'{}'), coalesce(item.removable,'{}'), coalesce(item.may_contain,'{}'), coalesce(item.also_contains,'{}'),
     coalesce(item.dietary_tags,'{}'),coalesce(item.notes,''),coalesce(item.special,false),false,'und',position);
 end loop;
 for row_data in select value from jsonb_array_elements(job.payload->'change') loop
   item := jsonb_populate_record(null::public.menu_items, row_data);
   update public.menu_items set name=item.name, description=item.description, price=item.price, section=coalesce(item.section,''),
     calories=item.calories, spice=item.spice, allergens=item.allergens, removable=coalesce(item.removable,'{}'), may_contain=coalesce(item.may_contain,'{}'),
     also_contains=coalesce(item.also_contains,'{}'), dietary_tags=item.dietary_tags, notes=item.notes, special=coalesce(item.special,false), confirmed=false
   where id=item.id and restaurant_id=restaurant and revision=item.revision;
   if not found then raise exception 'Dish changed since preview' using errcode = '40001'; end if;
 end loop;
 update public.menu_imports set applied_at=now() where id=preview;
 return job.payload->'summary';
end;
$$;
revoke all on function public.apply_menu_import(uuid,uuid) from public, anon;
grant execute on function public.apply_menu_import(uuid,uuid) to authenticated;

-- 20261028000000_review_reminders.sql
-- Use the immutable audit trail rather than inventing review dates for older dishes.
create function public.latest_dish_reviews(restaurant uuid)
returns table(menu_item_id uuid, reviewed_at timestamptz)
language sql stable security invoker set search_path = '' as $$
 select h.menu_item_id, max(h.changed_at)
 from public.dish_history h
 where h.restaurant_id = restaurant and h.action = 'confirmed'
   and public.can_edit_restaurant(restaurant)
 group by h.menu_item_id;
$$;
revoke all on function public.latest_dish_reviews(uuid) from public, anon;
grant execute on function public.latest_dish_reviews(uuid) to authenticated;

-- Re-review an unchanged, already confirmed dish atomically. The temporary false flag is never
-- visible outside this transaction; the existing trigger writes a new dated confirmation.
create function public.review_dish_again(restaurant uuid, dish uuid, expected_revision integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
 if auth.uid() is null or not public.can_edit_restaurant(restaurant) then
   raise exception 'Not authorized' using errcode = '42501';
 end if;
 update public.menu_items set confirmed = false
 where id = dish and restaurant_id = restaurant and revision = expected_revision
   and confirmed and allergen_list = 2 and also_checked;
 if not found then raise exception 'Dish changed; review it again' using errcode = '40001'; end if;
 update public.menu_items set confirmed = true where id = dish and restaurant_id = restaurant;
end;
$$;
revoke all on function public.review_dish_again(uuid,uuid,integer) from public, anon;
grant execute on function public.review_dish_again(uuid,uuid,integer) to authenticated;

commit;
