-- The few dishes diners open most at a restaurant, for a "Popular" badge on its menu.
-- It returns which dishes only, never counts, and only once a dish has enough views to mean something.
create function public.popular_dishes(restaurant uuid)
returns table (dish_id uuid)
language sql stable security definer set search_path = '' as $$
  select m.id
  from public.menu_items m
  join public.dish_stats s on s.menu_item_id = m.id and s.day > current_date - 30
  where m.restaurant_id = restaurant and m.confirmed
  group by m.id
  having sum(s.views) >= 10
  order by sum(s.views) desc
  limit 3;
$$;
grant execute on function public.popular_dishes(uuid) to anon, authenticated;
