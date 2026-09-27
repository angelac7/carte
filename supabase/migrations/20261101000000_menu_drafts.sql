-- A draft menu: dishes an owner prepares, and confirms, while the current menu stays live. Diners
-- never see a draft. Publishing swaps it in at once, so diners never see a half-changed menu.
alter table public.menu_items
  add column draft boolean not null default false,
  -- Confirmed for when the draft is published. Only then does "confirmed" turn on.
  add column draft_confirmed boolean not null default false,
  add constraint menu_items_drafts_stay_hidden check (not (draft and confirmed));

-- Any edit still sets a dish back to unconfirmed, drafts included. Confirming a draft dish records
-- it for publishing instead of showing it to diners.
create or replace function public.reset_dish_confirmation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.name, new.description, new.price, new.allergens, new.dietary_tags, new.notes, new.photo_url, new.source_language, new.sizes, new.addons, new.removable, new.may_contain, new.also_contains, new.calories)
     is distinct from
     row(old.name, old.description, old.price, old.allergens, old.dietary_tags, old.notes, old.photo_url, old.source_language, old.sizes, old.addons, old.removable, old.may_contain, old.also_contains, old.calories) then
    new.confirmed := false;
    new.draft_confirmed := false;
  end if;
  if new.draft and new.confirmed then
    new.draft_confirmed := true;
    new.confirmed := false;
  end if;
  return new;
end;
$$;

-- Publishes the draft: every draft dish must be confirmed first. With replace_menu, the dishes
-- diners see now are removed in the same step; otherwise the draft is added to them.
create function public.publish_draft(restaurant uuid, replace_menu boolean)
returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  published integer;
begin
  if auth.uid() is null or not public.can_edit_restaurant(restaurant) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('carte-draft:' || restaurant::text));
  if not exists (select 1 from public.menu_items m where m.restaurant_id = restaurant and m.draft) then
    raise exception 'No draft to publish' using errcode = '22023';
  end if;
  if exists (select 1 from public.menu_items m
             where m.restaurant_id = restaurant and m.draft and not m.draft_confirmed) then
    raise exception 'Confirm every draft dish first' using errcode = '40001';
  end if;
  if replace_menu then
    delete from public.menu_items m where m.restaurant_id = restaurant and not m.draft;
  end if;
  update public.menu_items m set draft = false, confirmed = true, draft_confirmed = false
  where m.restaurant_id = restaurant and m.draft;
  get diagnostics published = row_count;
  return published;
end;
$$;

-- Throws the draft away. The menu diners see doesn't change.
create function public.discard_draft(restaurant uuid)
returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  removed integer;
begin
  if auth.uid() is null or not public.can_edit_restaurant(restaurant) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  delete from public.menu_items m where m.restaurant_id = restaurant and m.draft;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.publish_draft(uuid, boolean) from public, anon;
revoke all on function public.discard_draft(uuid) from public, anon;
grant execute on function public.publish_draft(uuid, boolean) to authenticated;
grant execute on function public.discard_draft(uuid) to authenticated;
