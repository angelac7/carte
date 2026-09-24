-- View statistics for a signed-in owner's own restaurant. The view counts table has no public
-- access, so these functions check the caller's identity and return only their restaurant's numbers.

create function public.my_dish_views(days int default 7)
returns table (dish_id uuid, dish_name text, views bigint)
language sql stable security definer set search_path = '' as $$
  select m.id, m.name, coalesce(sum(s.views), 0)::bigint
  from public.restaurants r
  join public.menu_items m on m.restaurant_id = r.id
  left join public.dish_stats s
    on s.menu_item_id = m.id and s.day > current_date - least(greatest(days, 1), 90)
  where r.owner_id = (select auth.uid())
  group by m.id
  order by 3 desc;
$$;

create function public.my_daily_views(days int default 14)
returns table (day date, views bigint)
language sql stable security definer set search_path = '' as $$
  select d::date, coalesce(sum(s.views), 0)::bigint
  from generate_series(
         current_date - (least(greatest(days, 1), 90) - 1),
         current_date,
         interval '1 day'
       ) as d
  left join public.dish_stats s
    on s.day = d::date
   and s.menu_item_id in (
         select m.id from public.menu_items m
         join public.restaurants r on r.id = m.restaurant_id
         where r.owner_id = (select auth.uid()))
  group by d
  order by d;
$$;

revoke execute on function public.my_dish_views(int) from public, anon;
revoke execute on function public.my_daily_views(int) from public, anon;
grant execute on function public.my_dish_views(int) to authenticated;
grant execute on function public.my_daily_views(int) to authenticated;
