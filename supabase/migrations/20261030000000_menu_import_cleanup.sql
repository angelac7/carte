-- Spreadsheet previews expire after 30 minutes. Each is kept a day beyond that, so a retry after a
-- lost reply still finds its receipt, then removed whenever someone makes a new preview.
create index menu_imports_expiry on public.menu_imports (expires_at);

create function public.remove_old_menu_imports() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.menu_imports where expires_at < now() - interval '1 day';
  return null;
end;
$$;
revoke all on function public.remove_old_menu_imports() from public, anon, authenticated;

create trigger menu_imports_cleanup after insert on public.menu_imports
  for each statement execute function public.remove_old_menu_imports();

delete from public.menu_imports where expires_at < now() - interval '1 day';
