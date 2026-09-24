-- Dish photos uploaded by owners, stored in a public Supabase Storage bucket.

alter table public.menu_items
  add column photo_url text
  check (photo_url is null
         or photo_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/dish-photos/');

-- Public so diners can see photos; only the server (using the secret key) can upload or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-photos', 'dish-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
