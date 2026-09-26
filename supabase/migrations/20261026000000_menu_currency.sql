-- The currency a menu's prices are in, like USD or JPY, so diners can see an approximate price in
-- their own. Empty means Carte works it out from the price symbols and time zone.
alter table public.restaurants
  add column currency text not null default ''
  check (currency = '' or currency ~ '^[A-Z]{3}$');
