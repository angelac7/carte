-- Owners and editors couldn't save their profile: the accessibility, kitchen practice, and
-- currency settings were added without permission to change them, and the profile form saves
-- every setting at once. Owners still can't approve their own map claim or lift a suspension.
grant update (features, kitchen_practices, currency) on public.restaurants to authenticated;
