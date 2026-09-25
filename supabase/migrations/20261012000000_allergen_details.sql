-- Two more things kitchens know about allergens:
--   removable: allergens in the dish that can be left out on request (like sesame in a dressing)
--   may_contain: allergens not in the recipe that may get in, like through a shared fryer
-- Both are safety information, so changing them needs a fresh review.
alter table public.menu_items
  add column removable text[] not null default '{}',
  add column may_contain text[] not null default '{}',
  add constraint menu_items_removable_in_dish check (removable <@ allergens),
  add constraint menu_items_may_contain_known check (may_contain <@ array[
    'milk','eggs','fish','shellfish','tree nuts','peanuts','wheat','soy','sesame',
    'celery','mustard','lupin','mollusks','sulfites']::text[]),
  add constraint menu_items_may_contain_not_in_dish check (not (may_contain && allergens));

create or replace function public.reset_dish_confirmation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.name, new.description, new.price, new.allergens, new.dietary_tags, new.notes, new.photo_url, new.source_language, new.sizes, new.addons, new.removable, new.may_contain)
     is distinct from
     row(old.name, old.description, old.price, old.allergens, old.dietary_tags, old.notes, old.photo_url, old.source_language, old.sizes, old.addons, old.removable, old.may_contain) then
    new.confirmed := false;
  end if;
  return new;
end;
$$;
