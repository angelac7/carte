-- Whether a dish can be ordered right now. None of this changes what the dish is, so
-- updating it doesn't need a fresh review.
alter table public.menu_items
  -- The service day the dish sold out; it comes back on its own the next day.
  add column sold_out_on date,
  -- Specials are shown together at the top of the menu.
  add column special boolean not null default false,
  -- An optional daily serving window, in the restaurant's time zone. A window that ends
  -- before it starts runs past midnight.
  add column available_from time,
  add column available_until time,
  add constraint menu_items_serving_window
    check ((available_from is null) = (available_until is null));
