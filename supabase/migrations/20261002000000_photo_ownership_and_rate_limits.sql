-- New writes may only reference photos belonging to that dish and restaurant.
-- Existing rows are left intact; server deletion also validates the restaurant directory.
alter table public.menu_items add constraint menu_items_own_photo
  check (photo_url is null or photo_url ~ (
    '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/dish-photos/'
    || restaurant_id::text || '/' || id::text || '-[0-9]+\.(jpg|png|webp)$'
  )) not valid;

-- Shared counters contain hashed keys, never raw IP addresses.
create table public.rate_limits (
  key_hash text primary key,
  hits integer not null,
  expires_at timestamptz not null
);
create index rate_limits_expiry on public.rate_limits(expires_at);
alter table public.rate_limits enable row level security;

create function public.consume_rate_limit(key_hash text, max_hits integer, window_ms integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  accepted boolean := false;
  stamp timestamptz := clock_timestamp();
begin
  if max_hits < 1 or window_ms < 1 or char_length(key_hash) <> 64 then return false; end if;
  delete from public.rate_limits r where r.expires_at <= stamp;
  insert into public.rate_limits as r (key_hash, hits, expires_at)
  values (key_hash, 1, stamp + window_ms * interval '1 millisecond')
  on conflict on constraint rate_limits_pkey do update
    set hits = case when r.expires_at <= stamp then 1 else r.hits + 1 end,
        expires_at = case when r.expires_at <= stamp
          then stamp + window_ms * interval '1 millisecond' else r.expires_at end
    where r.expires_at <= stamp or r.hits < max_hits
  returning true into accepted;
  return coalesce(accepted, false);
end;
$$;
revoke execute on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
