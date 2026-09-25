-- One order a whole table adds to from their own phones, through a shared link.
-- It holds dishes and quantities only, nothing about the diners, and expires after six hours.
create table public.shared_orders (
  code text primary key check (code ~ '^[a-z2-9]{10}$'),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  -- Quantities by order line: a dish id, or a dish id with its size and add-ons.
  lines jsonb not null default '{}'::jsonb check (jsonb_typeof(lines) = 'object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '6 hours'
);
create index shared_orders_expiry on public.shared_orders (expires_at);

-- Reached only through the functions below, which check the restaurant and dishes.
alter table public.shared_orders enable row level security;
revoke all on public.shared_orders from anon, authenticated;

-- A line key must name a confirmed dish at this restaurant.
create function public.shared_line_ok(restaurant uuid, line text) returns boolean
language sql stable security definer set search_path = '' as $$
  select line ~ '^[0-9a-f-]{36}(\|[0-9]*\|[0-9.]*)?$'
    and exists (
      select 1 from public.menu_items m
      where m.id = split_part(line, '|', 1)::uuid and m.restaurant_id = restaurant and m.confirmed);
$$;

create function public.create_shared_order(restaurant uuid, code text, initial jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cleaned jsonb := '{}'::jsonb;
  entry record;
begin
  if not exists (select 1 from public.restaurants r where r.id = restaurant) then
    raise exception 'unknown restaurant';
  end if;
  for entry in select key, value from jsonb_each(coalesce(initial, '{}'::jsonb)) limit 60 loop
    if public.shared_line_ok(restaurant, entry.key) and jsonb_typeof(entry.value) = 'number'
       and (entry.value)::int between 1 and 20 then
      cleaned := cleaned || jsonb_build_object(entry.key, (entry.value)::int);
    end if;
  end loop;
  delete from public.shared_orders where expires_at < now();
  insert into public.shared_orders (code, restaurant_id, lines) values (code, restaurant, cleaned);
  return cleaned;
end;
$$;

create function public.get_shared_order(code text)
returns table (restaurant_id uuid, lines jsonb, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.restaurant_id, s.lines, s.expires_at from public.shared_orders s
  where s.code = get_shared_order.code and s.expires_at > now();
$$;

-- Sets one line's quantity in a single step, so two diners adding at once never overwrite each other.
create function public.set_shared_line(code text, line text, quantity int)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  existing public.shared_orders;
begin
  select * into existing from public.shared_orders s
  where s.code = set_shared_line.code and s.expires_at > now()
  for update;
  if not found then return null; end if;
  if not public.shared_line_ok(existing.restaurant_id, line) then
    raise exception 'unknown dish';
  end if;
  if quantity <= 0 then
    update public.shared_orders s set lines = s.lines - line
    where s.code = existing.code returning s.lines into existing.lines;
  elsif (select count(*) from jsonb_object_keys(existing.lines)) >= 60 and not existing.lines ? line then
    raise exception 'order too long';
  else
    update public.shared_orders s set lines = s.lines || jsonb_build_object(line, least(quantity, 20))
    where s.code = existing.code returning s.lines into existing.lines;
  end if;
  return existing.lines;
end;
$$;

-- Only Carte's server calls these, after checking input and rate limits.
revoke all on function public.shared_line_ok(uuid, text) from public, anon, authenticated;
revoke all on function public.create_shared_order(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.get_shared_order(text) from public, anon, authenticated;
revoke all on function public.set_shared_line(text, text, int) from public, anon, authenticated;
grant execute on function public.create_shared_order(uuid, text, jsonb) to service_role;
grant execute on function public.get_shared_order(text) to service_role;
grant execute on function public.set_shared_line(text, text, int) to service_role;
