-- Other things diners avoid, like pork or alcohol, marked by owners on each dish. also_checked
-- says the owner has looked at these for the dish, so diners know an empty list means none.
alter table public.menu_items
  add column also_contains text[] not null default '{}'
  check (also_contains <@ array['pork', 'beef', 'alcohol', 'onion', 'garlic', 'cilantro']::text[]),
  add column also_checked boolean not null default false;

-- Changing them needs a fresh review, like allergens.
create or replace function public.reset_dish_confirmation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.name, new.description, new.price, new.allergens, new.dietary_tags, new.notes, new.photo_url, new.source_language, new.sizes, new.addons, new.removable, new.may_contain, new.also_contains)
     is distinct from
     row(old.name, old.description, old.price, old.allergens, old.dietary_tags, old.notes, old.photo_url, old.source_language, old.sizes, old.addons, old.removable, old.may_contain, old.also_contains) then
    new.confirmed := false;
  end if;
  return new;
end;
$$;

-- And they're part of the allergen history.
create or replace function public.dish_safety(item public.menu_items) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'allergens', item.allergens,
    'may_contain', item.may_contain,
    'removable', item.removable,
    'dietary_tags', item.dietary_tags,
    'also_contains', item.also_contains,
    'allergen_list', item.allergen_list,
    'addon_allergens', coalesce((
      select jsonb_agg(jsonb_build_object('label', addon->>'label', 'allergens', addon->'allergens'))
      from jsonb_array_elements(item.addons) addon
      where jsonb_array_length(coalesce(addon->'allergens', '[]'::jsonb)) > 0), '[]'::jsonb));
$$;
