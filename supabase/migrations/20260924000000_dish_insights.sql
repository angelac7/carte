-- AI dish explanations, generated once per dish and language, then reused.
create table public.dish_insights (
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  language text not null check (language in ('en','es','zh','ko','ja','fr','vi')),
  source_hash text not null,
  insight jsonb not null,
  created_at timestamptz not null default now(),
  primary key (menu_item_id, language)
);

alter table public.dish_insights enable row level security;

-- Readable for confirmed dishes; written only by the server using the secret key.
create policy "Insights of confirmed dishes are public" on public.dish_insights
  for select using (exists (
    select 1 from public.menu_items m
    where m.id = menu_item_id and m.confirmed));
