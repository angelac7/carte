-- What diners look for at a restaurant: which allergies and diets they filter for, and what
-- they searched for without finding it. Anonymous daily totals only, like dish views.
create table public.diner_interest (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  day date not null default current_date,
  kind text not null check (kind in ('avoid', 'diet', 'missed_search')),
  value text not null check (char_length(value) between 1 and 40),
  uses integer not null default 0,
  primary key (restaurant_id, day, kind, value)
);
alter table public.diner_interest enable row level security;
revoke all on public.diner_interest from anon, authenticated;

-- Adds one visit's filters, or one search that found nothing. Only Carte's server calls this.
create function public.record_diner_interest(restaurant uuid, avoid text[], diets text[], missed text)
returns void
language sql security definer set search_path = '' as $$
  insert into public.diner_interest (restaurant_id, kind, value, uses)
  select restaurant, kind, value, 1
  from (
    select 'avoid' as kind, unnest(avoid) as value
    union all select 'diet', unnest(diets)
    union all select 'missed_search', missed where coalesce(missed, '') <> ''
  ) picked
  where exists (select 1 from public.restaurants r where r.id = restaurant)
  on conflict (restaurant_id, day, kind, value)
  do update set uses = public.diner_interest.uses + 1;
$$;
revoke all on function public.record_diner_interest(uuid, text[], text[], text) from public, anon, authenticated;
grant execute on function public.record_diner_interest(uuid, text[], text[], text) to service_role;

-- Totals for the dashboard. A missed search shows only once more than one visit searched for it.
create function public.restaurant_diner_interest(restaurant uuid, days int default 30)
returns table (kind text, value text, uses bigint)
language sql stable security definer set search_path = '' as $$
  select i.kind, i.value, sum(i.uses)::bigint
  from public.diner_interest i
  where i.restaurant_id = restaurant
    and public.can_edit_restaurant(restaurant)
    and i.day > current_date - least(greatest(days, 1), 90)
  group by i.kind, i.value
  having i.kind <> 'missed_search' or sum(i.uses) >= 2
  order by 3 desc
  limit 60;
$$;
revoke all on function public.restaurant_diner_interest(uuid, int) from public, anon;
grant execute on function public.restaurant_diner_interest(uuid, int) to authenticated;
