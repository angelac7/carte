-- How many AI calls Carte made each day, by restaurant and feature, so spending has a ceiling and
-- administrators can see where it goes. Calls with no restaurant, like scanning a paper menu, have
-- no restaurant. Nothing about the diner is kept.
create table public.ai_usage (
  day date not null default current_date,
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  feature text not null check (feature ~ '^[a-z-]{1,30}$'),
  calls integer not null default 0
);
create unique index ai_usage_key on public.ai_usage
  (day, (coalesce(restaurant_id, '00000000-0000-0000-0000-000000000000'::uuid)), feature);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Counts one AI call if it fits under today's limits: one for each restaurant, one for all of
-- Carte. Returns false, counting nothing, when a limit is reached.
create function public.consume_ai_call(for_restaurant uuid, for_feature text, restaurant_limit int, daily_limit int)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  -- One at a time, so two requests can't both take the last call.
  perform pg_advisory_xact_lock(hashtext('carte-ai-usage'));
  if (select coalesce(sum(u.calls), 0) from public.ai_usage u where u.day = current_date) >= daily_limit then
    return false;
  end if;
  if for_restaurant is not null and (
    select coalesce(sum(u.calls), 0) from public.ai_usage u
    where u.day = current_date and u.restaurant_id = for_restaurant) >= restaurant_limit then
    return false;
  end if;
  insert into public.ai_usage as u (day, restaurant_id, feature, calls)
  values (current_date, for_restaurant, for_feature, 1)
  on conflict (day, (coalesce(restaurant_id, '00000000-0000-0000-0000-000000000000'::uuid)), feature)
  do update set calls = u.calls + 1;
  -- About a year is plenty to look back on.
  delete from public.ai_usage u where u.day < current_date - 400;
  return true;
end;
$$;
revoke all on function public.consume_ai_call(uuid, text, int, int) from public, anon, authenticated;
grant execute on function public.consume_ai_call(uuid, text, int, int) to service_role;

-- Today's and recent AI calls by restaurant and feature, for administrators only.
create function public.admin_ai_usage(days int default 30)
returns table (restaurant_id uuid, restaurant_name text, restaurant_slug text, feature text, today bigint, recent bigint)
language sql stable security definer set search_path = '' as $$
  select u.restaurant_id, r.name, r.slug, u.feature,
         sum(u.calls) filter (where u.day = current_date),
         sum(u.calls)
  from public.ai_usage u
  left join public.restaurants r on r.id = u.restaurant_id
  where public.is_carte_admin() and u.day > current_date - greatest(least(days, 400), 1)
  group by u.restaurant_id, r.name, r.slug, u.feature
  order by sum(u.calls) desc, r.name nulls last, u.feature;
$$;
revoke all on function public.admin_ai_usage(int) from public, anon;
grant execute on function public.admin_ai_usage(int) to authenticated;
