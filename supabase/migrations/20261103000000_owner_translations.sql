-- Owners and editors can correct the wording of their dishes' translations. A corrected
-- translation stays until the dish's own text changes; then it's translated afresh. Allergen and
-- diet names aren't in here: they always use Carte's fixed translations.
alter table public.translations add column edited_at timestamptz;

create policy "Owners and editors add translations of their dishes" on public.translations
  for insert to authenticated
  with check (exists (
    select 1 from public.menu_items m
    where m.id = menu_item_id and public.can_edit_restaurant(m.restaurant_id)));
create policy "Owners and editors correct translations of their dishes" on public.translations
  for update to authenticated
  using (exists (
    select 1 from public.menu_items m
    where m.id = menu_item_id and public.can_edit_restaurant(m.restaurant_id)))
  with check (exists (
    select 1 from public.menu_items m
    where m.id = menu_item_id and public.can_edit_restaurant(m.restaurant_id)));
create policy "Owners and editors see translations of their dishes" on public.translations
  for select to authenticated
  using (exists (
    select 1 from public.menu_items m
    where m.id = menu_item_id and public.can_edit_restaurant(m.restaurant_id)));
revoke insert, update, delete on public.translations from anon;
