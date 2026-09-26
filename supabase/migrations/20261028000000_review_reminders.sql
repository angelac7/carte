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
