-- Facts about the whole kitchen, like a shared fryer, that diners with allergies should know.
-- Owners pick from a fixed list so every language has a checked translation.
alter table public.restaurants
  add column kitchen_practices text[] not null default '{}'
  check (kitchen_practices <@ array[
    'shared-fryer', 'shared-grill', 'shared-surfaces', 'nuts-in-kitchen', 'peanut-oil',
    'sesame-in-kitchen', 'flour-in-kitchen', 'shellfish-in-kitchen']::text[]);
