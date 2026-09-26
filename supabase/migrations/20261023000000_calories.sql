-- Calories per serving, typed by the owner (never estimated by AI). Optional.
alter table public.menu_items
  add column calories integer check (calories between 0 and 5000);

-- Like the price, changing it needs a fresh review.
create or replace function public.reset_dish_confirmation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.name, new.description, new.price, new.allergens, new.dietary_tags, new.notes, new.photo_url, new.source_language, new.sizes, new.addons, new.removable, new.may_contain, new.also_contains, new.calories)
     is distinct from
     row(old.name, old.description, old.price, old.allergens, old.dietary_tags, old.notes, old.photo_url, old.source_language, old.sizes, old.addons, old.removable, old.may_contain, old.also_contains, old.calories) then
    new.confirmed := false;
  end if;
  return new;
end;
$$;
