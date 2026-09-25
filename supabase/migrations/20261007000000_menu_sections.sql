-- Menu sections (like Starters or Noodles) and the owner's own dish order.
-- Both are layout only, so changing them doesn't need a fresh review of the dish.
alter table public.menu_items
  add column section text not null default '' check (char_length(section) <= 80),
  add column sort_order integer not null default 0;

create index menu_items_sort_order_idx on public.menu_items (restaurant_id, sort_order);

-- Existing dishes keep the order they were added in.
update public.menu_items m
set sort_order = ranked.n
from (
  select id, row_number() over (partition by restaurant_id order by created_at, id) as n
  from public.menu_items
) ranked
where ranked.id = m.id;

-- Section names are translated along with the rest of each dish's text.
alter table public.translations add column section text not null default '';

-- Saves a new dish order in one step, only for dishes in the owner's own restaurant.
create function public.reorder_dishes(restaurant uuid, ordered uuid[])
returns table (id uuid, revision integer, sort_order integer)
language sql security invoker set search_path = '' as $$
  update public.menu_items m
  set sort_order = o.n
  from unnest(ordered) with ordinality as o(dish_id, n)
  where m.id = o.dish_id and m.restaurant_id = restaurant and m.sort_order is distinct from o.n
  returning m.id, m.revision, m.sort_order;
$$;
revoke all on function public.reorder_dishes(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_dishes(uuid, uuid[]) to authenticated;
