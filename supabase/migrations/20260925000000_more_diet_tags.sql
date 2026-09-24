-- Owner-only diet labels: halal, kosher, pregnancy-friendly, and kid-friendly.
alter table public.menu_items drop constraint menu_items_dietary_tags_check;
alter table public.menu_items add constraint menu_items_dietary_tags_check
  check (dietary_tags <@ array[
    'vegan','vegetarian','gluten-free','halal','kosher','pregnancy-friendly','kid-friendly'
  ]::text[]);
