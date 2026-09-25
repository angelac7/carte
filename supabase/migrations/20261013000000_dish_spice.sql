-- How spicy a dish is: 0 not spicy, 1 mild, 2 medium, 3 hot, or null when not set.
-- A comfort setting, not safety information, so changing it doesn't need a fresh review.
alter table public.menu_items add column spice smallint check (spice between 0 and 3);
