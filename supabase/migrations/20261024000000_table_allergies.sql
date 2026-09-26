-- People ordering together can each choose to share their allergies, so one card tells the
-- server about the whole table. Kept only with the shared order, and deleted with it.
alter table public.shared_orders
  add column allergies jsonb not null default '{}'::jsonb
  check (jsonb_typeof(allergies) = 'object');

-- Adds, updates, or (with a null entry) removes one person's allergies. Carte's server checks
-- each entry before calling this; the database limits its size and the number of people.
create function public.set_shared_allergies(code text, person text, entry jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  existing public.shared_orders;
begin
  if person !~ '^[a-z2-9]{12}$' then
    raise exception 'unknown person';
  end if;
  if entry is not null and (jsonb_typeof(entry) <> 'object' or octet_length(entry::text) > 1000) then
    raise exception 'invalid allergies';
  end if;
  select * into existing from public.shared_orders s
  where s.code = set_shared_allergies.code and s.expires_at > now()
  for update;
  if not found then return null; end if;
  if entry is null then
    update public.shared_orders s set allergies = s.allergies - person
    where s.code = existing.code returning s.allergies into existing.allergies;
  elsif (select count(*) from jsonb_object_keys(existing.allergies)) >= 20
        and not existing.allergies ? person then
    raise exception 'table full';
  else
    update public.shared_orders s set allergies = s.allergies || jsonb_build_object(person, entry)
    where s.code = existing.code returning s.allergies into existing.allergies;
  end if;
  return existing.allergies;
end;
$$;
revoke all on function public.set_shared_allergies(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.set_shared_allergies(text, text, jsonb) to service_role;

-- The shared order now includes what people chose to share.
drop function public.get_shared_order(text);
create function public.get_shared_order(code text)
returns table (restaurant_id uuid, lines jsonb, allergies jsonb, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.restaurant_id, s.lines, s.allergies, s.expires_at from public.shared_orders s
  where s.code = get_shared_order.code and s.expires_at > now();
$$;
revoke all on function public.get_shared_order(text) from public, anon, authenticated;
grant execute on function public.get_shared_order(text) to service_role;
