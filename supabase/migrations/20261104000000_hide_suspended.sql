-- A suspended menu is gone for everyone but its own team and Carte's administrators, even when
-- the database is asked directly. Diners also never see dishes from a menu that's switched off.
drop policy "Restaurants are public" on public.restaurants;
create policy "Restaurants are public unless suspended" on public.restaurants
  for select using (not suspended);
create policy "Teams and administrators see suspended restaurants" on public.restaurants
  for select to authenticated using (public.can_edit_restaurant(id) or public.is_carte_admin());

drop policy "Diners see confirmed dishes" on public.menu_items;
create policy "Diners see confirmed dishes" on public.menu_items
  for select using (
    confirmed and in_season and exists (
      select 1 from public.restaurants r where r.id = restaurant_id and not r.suspended));
