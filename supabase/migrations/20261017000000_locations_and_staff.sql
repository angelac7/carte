-- Owners can run more than one location, and invite people to help keep a menu up to date.
-- Editors can change and confirm the menu and profile; only the owner manages the team,
-- the map listing, and deleting the restaurant.
alter table public.restaurants drop constraint restaurants_owner_id_key;
create index restaurants_owner_idx on public.restaurants (owner_id);

create table public.restaurant_members (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'editor' check (role in ('editor')),
  created_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);
create index restaurant_members_user_idx on public.restaurant_members (user_id);
alter table public.restaurant_members enable row level security;

create function public.owns_restaurant(restaurant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.restaurants r where r.id = restaurant and r.owner_id = (select auth.uid()));
$$;

create function public.can_edit_restaurant(restaurant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.owns_restaurant(restaurant) or exists (
    select 1 from public.restaurant_members m
    where m.restaurant_id = restaurant and m.user_id = (select auth.uid()));
$$;

-- People see their own memberships; owners see and remove their team. Joining is only by invite.
create policy "Members and owners see the team" on public.restaurant_members
  for select using (user_id = (select auth.uid()) or public.owns_restaurant(restaurant_id));
create policy "Owners remove editors, and editors can leave" on public.restaurant_members
  for delete using (user_id = (select auth.uid()) or public.owns_restaurant(restaurant_id));
revoke all on public.restaurant_members from anon, authenticated;
grant select, delete on public.restaurant_members to authenticated;

-- An invite is a link the owner shares. Whoever opens it while signed in joins as an editor.
create table public.restaurant_invites (
  code text primary key check (code ~ '^[a-z2-9]{12}$'),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz
);
alter table public.restaurant_invites enable row level security;
create policy "Owners see their invites" on public.restaurant_invites
  for select using (public.owns_restaurant(restaurant_id));
create policy "Owners create invites" on public.restaurant_invites
  for insert with check (public.owns_restaurant(restaurant_id));
create policy "Owners cancel invites" on public.restaurant_invites
  for delete using (public.owns_restaurant(restaurant_id));
revoke all on public.restaurant_invites from anon, authenticated;
grant select, delete on public.restaurant_invites to authenticated;
grant insert (code, restaurant_id) on public.restaurant_invites to authenticated;

-- Joins the signed-in person to the invite's restaurant. Returns the restaurant, or null if the
-- invite is unknown, used, or expired. Each invite works once.
create function public.accept_invite(invite text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  target public.restaurant_invites;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  select * into target from public.restaurant_invites where code = invite for update;
  if not found or target.used_at is not null or target.expires_at < now() then
    return null;
  end if;
  if not public.owns_restaurant(target.restaurant_id) then
    insert into public.restaurant_members (restaurant_id, user_id)
    values (target.restaurant_id, (select auth.uid()))
    on conflict do nothing;
  end if;
  update public.restaurant_invites set used_by = (select auth.uid()), used_at = now()
  where code = invite;
  return target.restaurant_id;
end;
$$;
revoke all on function public.accept_invite(text) from public, anon;
grant execute on function public.accept_invite(text) to authenticated;

-- Editing is shared between the owner and editors. Deleting the restaurant stays owner-only.
drop policy "Owners update their restaurant" on public.restaurants;
create policy "Owners and editors update the restaurant" on public.restaurants
  for update using (public.can_edit_restaurant(id)) with check (public.can_edit_restaurant(id));

drop policy "Owners see their dishes" on public.menu_items;
drop policy "Owners add dishes" on public.menu_items;
drop policy "Owners update dishes" on public.menu_items;
drop policy "Owners delete dishes" on public.menu_items;
create policy "Owners and editors see the dishes" on public.menu_items
  for select using (public.can_edit_restaurant(restaurant_id));
create policy "Owners and editors add dishes" on public.menu_items
  for insert with check (public.can_edit_restaurant(restaurant_id));
create policy "Owners and editors update dishes" on public.menu_items
  for update using (public.can_edit_restaurant(restaurant_id))
  with check (public.can_edit_restaurant(restaurant_id));
create policy "Owners and editors delete dishes" on public.menu_items
  for delete using (public.can_edit_restaurant(restaurant_id));

drop policy "Owners see their reports" on public.dish_reports;
drop policy "Owners resolve their reports" on public.dish_reports;
create policy "Owners and editors see reports" on public.dish_reports
  for select using (public.can_edit_restaurant(restaurant_id));
create policy "Owners and editors resolve reports" on public.dish_reports
  for update using (public.can_edit_restaurant(restaurant_id))
  with check (public.can_edit_restaurant(restaurant_id));

create or replace function public.delete_menu_snapshot(restaurant uuid, expected jsonb)
returns table(photo_url text) language plpgsql security invoker set search_path = '' as $$
declare actual jsonb;
begin
  if not public.can_edit_restaurant(restaurant) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  perform 1 from public.restaurants where id = restaurant for update;
  perform 1 from public.menu_items where restaurant_id = restaurant for update;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'revision', revision) order by id), '[]'::jsonb)
    into actual from public.menu_items where restaurant_id = restaurant;
  if actual is distinct from (select coalesce(jsonb_agg(value order by value->>'id'), '[]'::jsonb) from jsonb_array_elements(expected)) then
    raise exception 'Menu changed. Reload before deleting.' using errcode = '40001';
  end if;
  return query delete from public.menu_items where restaurant_id = restaurant returning menu_items.photo_url;
end;
$$;

-- Dashboard statistics for one restaurant, now that a person can work on several.
create function public.restaurant_dish_views(restaurant uuid, days int default 7)
returns table (dish_id uuid, dish_name text, views bigint)
language sql stable security definer set search_path = '' as $$
  select m.id, m.name, coalesce(sum(s.views), 0)::bigint
  from public.menu_items m
  left join public.dish_stats s
    on s.menu_item_id = m.id and s.day > current_date - least(greatest(days, 1), 90)
  where m.restaurant_id = restaurant and public.can_edit_restaurant(restaurant)
  group by m.id
  order by 3 desc;
$$;

create function public.restaurant_daily_views(restaurant uuid, days int default 14)
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
   and public.can_edit_restaurant(restaurant)
   and s.menu_item_id in (select m.id from public.menu_items m where m.restaurant_id = restaurant)
  group by d
  order by d;
$$;

revoke execute on function public.restaurant_dish_views(uuid, int) from public, anon;
revoke execute on function public.restaurant_daily_views(uuid, int) from public, anon;
grant execute on function public.restaurant_dish_views(uuid, int) to authenticated;
grant execute on function public.restaurant_daily_views(uuid, int) to authenticated;

-- The restaurant an invite is for, so the person opening it can see what they'd join.
create function public.peek_invite(invite text) returns table (restaurant_name text)
language sql stable security definer set search_path = '' as $$
  select r.name from public.restaurant_invites i
  join public.restaurants r on r.id = i.restaurant_id
  where i.code = invite and i.used_at is null and i.expires_at > now();
$$;
revoke all on function public.peek_invite(text) from public, anon;
grant execute on function public.peek_invite(text) to authenticated;
