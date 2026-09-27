-- Phones change a shared order by how much, not by setting a total, so two diners adding the
-- same dish at once both count. Each change has a random id from the phone; a retry after a lost
-- reply carries the same id and is ignored, so it's never counted twice.
alter table public.shared_orders add column recent_changes text[] not null default '{}';

create function public.change_shared_line(code text, line text, change int, change_id text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  existing public.shared_orders;
  current_quantity int;
  wanted int;
begin
  if change_id !~ '^[a-z2-9]{12}$' or change not between -20 and 20
     or line !~ '^[0-9a-f-]{36}(\|[0-9]*\|[0-9.]*)?$' then
    raise exception 'invalid change';
  end if;
  select * into existing from public.shared_orders s
  where s.code = change_shared_line.code and s.expires_at > now()
  for update;
  if not found then return null; end if;
  if change_id = any(existing.recent_changes) then return existing.lines; end if;

  current_quantity := coalesce((existing.lines ->> line)::int, 0);
  wanted := least(greatest(current_quantity + change, 0), 20);
  -- Adding needs a dish diners can order; taking one off never does, even if the owner has
  -- since unconfirmed it.
  if wanted > current_quantity and not public.shared_line_ok(existing.restaurant_id, line) then
    raise exception 'unknown dish';
  end if;
  if current_quantity = 0 and wanted > 0
     and (select count(*) from jsonb_object_keys(existing.lines)) >= 60 then
    raise exception 'order too long';
  end if;

  update public.shared_orders s set
    lines = case when wanted = 0 then s.lines - line
                 else s.lines || jsonb_build_object(line, wanted) end,
    -- The last 200 changes are plenty to recognize a retry.
    recent_changes = (array_append(s.recent_changes, change_id))
                     [greatest(1, cardinality(s.recent_changes) - 198):]
  where s.code = existing.code
  returning s.lines into existing.lines;
  return existing.lines;
end;
$$;

-- Phones that loaded Carte before this change still set totals. Taking a dish off works for them
-- too now, even one the owner has since unconfirmed.
create or replace function public.set_shared_line(code text, line text, quantity int)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  existing public.shared_orders;
begin
  select * into existing from public.shared_orders s
  where s.code = set_shared_line.code and s.expires_at > now()
  for update;
  if not found then return null; end if;
  if quantity > 0 and not public.shared_line_ok(existing.restaurant_id, line) then
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

-- Only Carte's server calls this, after checking input and rate limits.
revoke all on function public.change_shared_line(text, text, int, text) from public, anon, authenticated;
grant execute on function public.change_shared_line(text, text, int, text) to service_role;
