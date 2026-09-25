-- Sizes (like Small or Large, each with its own price) and add-ons (like "Add egg"), which can
-- bring their own allergens. Add-ons are safety information, so changing them needs a fresh review.
-- The allergen list matches lib/allergens.ts; update both together.
create function public.valid_addons(addons jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(addons) = 'array'
    and jsonb_array_length(addons) <= 12
    and not exists (
      select 1 from jsonb_array_elements(addons) addon
      where jsonb_typeof(addon -> 'allergens') <> 'array'
         or exists (
           select 1 from jsonb_array_elements_text(addon -> 'allergens') allergen
           where allergen not in ('milk','eggs','fish','shellfish','tree nuts','peanuts','wheat','soy','sesame')));
$$;

alter table public.menu_items
  add column sizes jsonb not null default '[]'
    check (jsonb_typeof(sizes) = 'array' and jsonb_array_length(sizes) <= 8),
  add column addons jsonb not null default '[]' check (public.valid_addons(addons));

create or replace function public.reset_dish_confirmation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.name, new.description, new.price, new.allergens, new.dietary_tags, new.notes, new.photo_url, new.source_language, new.sizes, new.addons)
     is distinct from
     row(old.name, old.description, old.price, old.allergens, old.dietary_tags, old.notes, old.photo_url, old.source_language, old.sizes, old.addons) then
    new.confirmed := false;
  end if;
  return new;
end;
$$;

-- Translated size and add-on names, in the same order as the dish's sizes then add-ons.
alter table public.translations add column options text[] not null default '{}';
