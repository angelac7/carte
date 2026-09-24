-- Existing menus have unknown source language: do not assume English.
alter table public.menu_items add column source_language text not null default 'und'
  check (source_language ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$' and length(source_language) <= 35);
alter table public.translations drop constraint translations_language_check;
alter table public.translations add constraint translations_language_check
  check (language in ('en','es','zh','ko','ja','fr','vi'));
create or replace function public.reset_dish_confirmation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.name, new.description, new.price, new.allergens, new.dietary_tags, new.notes, new.photo_url, new.source_language)
     is distinct from
     row(old.name, old.description, old.price, old.allergens, old.dietary_tags, old.notes, old.photo_url, old.source_language) then
    new.confirmed := false;
  end if;
  return new;
end;
$$;
