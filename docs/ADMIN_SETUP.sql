-- Replace the email below with an existing, trusted Carte account. Run in Supabase SQL Editor.
-- This is separate from the application migration so access is never assigned automatically.
do $$
declare
  admin_email text := 'REPLACE_WITH_YOUR_CARTE_LOGIN_EMAIL';
  admin_id uuid;
begin
  select id into admin_id from auth.users where lower(email) = lower(admin_email);
  if admin_id is null then raise exception 'No Carte account found for the chosen email. Create the account first.'; end if;
  insert into public.carte_admins(user_id) values(admin_id) on conflict do nothing;
end;
$$;
