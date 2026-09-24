# Carte functionality inventory

This inventory describes the repository implementation. AI, authentication, database, storage,
and map features also require working service configuration. It is not a claim that every flow
has been exercised against a live production account.

## Public browsing

- Landing page with an interactive sample menu, allergy-filter demonstration, language demonstration,
  links to restaurants, diner features, and owner registration.
- Discover searches confirmed dishes and listed restaurants. Filters cover the nine supported
  allergens, dietary tags, city, occasion, and current opening hours.
- If a multiword craving has no direct dish matches, AI suggests search terms; database filtering
  still applies to those results.
- Trending dishes use anonymous views over the last seven days.
- Nearby search uses a city/neighborhood or browser geolocation, plus restaurant/cuisine keywords.
  Results show distance, source notes, and links to approved Carte menus where available.
- Place details include available address, hours, dietary tags, directions, website, and telephone.
  Map data is explicitly unconfirmed. Restaurants without a Carte menu link to paper-menu scanning.
- Desktop navigation and mobile tabs connect Discover, Nearby, Scan, and My Carte.

## Diner menus (`/r/<slug>`)

- Restaurant heading and dish cover image; confirmed dishes with names, descriptions, prices,
  photos, fixed allergen labels, dietary tags, and kitchen notes.
- Allergy and dietary filters saved on the device and shared across Carte menus and Discover.
  Excluded dishes are also omitted from the current order, recommendations, and photo matching.
- English, Spanish, Simplified Chinese, Korean, Japanese, French, and Vietnamese UI/labels.
  Dish text is AI-translated and cached in Supabase. Failed/incomplete translations can be retried.
- Dish details include explanation, taste, background, native name, pronunciation, estimated spice,
  richness, portion, glossary, pairings, and questions for staff. Confirmed allergens appear separately.
- Spoken dish names where browser speech synthesis is supported.
- Streaming menu chat with recent conversation, language selection, optional voice input and spoken
  replies. The assistant receives only dishes matching current filters.
- “What should I order?” considers hunger, spice tolerance, party size, and optional per-person budget.
- Photo identification returns candidates from the filtered confirmed menu, with confidence and
  a reminder that a visual match is not confirmation of ingredients.
- Quantity controls build a local order. The order can be edited, cleared, or shown to staff alongside
  allergy information. This does not send an order to a kitchen or take payment.
- Bill estimates support named diners, dishes assigned to a person or shared, tax, preset tips,
  unpriced-item notices, and allocation of rounding pennies.
- Allergy cards use fixed translations in the diner and staff languages.
- Larger text and high contrast settings on diner menus.
- Save dishes/menus, rate dishes, and record diary notes; related-dish suggestions use local history.

## Paper-menu scanning (`/scan`)

- Photograph/upload a menu; browser resizing reduces upload size.
- Stream translated dishes, original names, short explanations, and possible allergens.
- Highlight guesses matching the diner's selected allergies.
- Explicit unconfirmed-data warnings before and after scanning; capped results are marked partial.
- Show a fixed-translation allergy card in the detected menu language when supported.
- Scan another image; no scanned menu is saved to Carte's database.

## My Carte (`/my`)

- Saved dishes and restaurants, links back to their menus, and removal controls.
- Food diary with one entry per dish, a 1–5 star rating, and notes; edit or remove entries.
- AI taste profile after at least three ratings, using up to forty diary entries and forty saved dishes
  only when the diner explicitly requests it.
- Taste summary, favorite flavors, suggested dish types, and native sharing or clipboard copying.
- Six challenges: first bite, critic, regular, explorer, globetrotter, and menu master.
- Allergy-card access and controls to clear local My Carte data, including the displayed taste profile.
- Device-storage and sharing failures are surfaced instead of reporting a false success.
- Download a private JSON backup and restore it on another device, with a preview and explicit
  merge/replace choice. Invalid, duplicate, oversized, or over-capacity backups are rejected.

## Restaurant owners

- Signup, email confirmation, login, logout, password-reset request and password update.
- One restaurant per owner: initial name and menu-link setup.
- Dashboard counts dishes/confirmations/photos, shows setup progress, weekly top dishes, and a
  fourteen-day anonymous dish-view chart.
- Photograph/upload a menu and stream AI-extracted dishes, prices, suggested allergens and diet tags.
  Imported dishes start unconfirmed and retain detected source-language metadata. Owners can correct
  it, including choosing automatic detection for mixed text. English is also a translation target.
- Review/search/filter dishes by confirmation status; add manually, edit details, toggle allergens
  and tags, change kitchen notes, and confirm for diners.
- Upload, replace, and delete dish photos. Dish/photo edits require fresh confirmation.
- Delete individual dishes or the entire menu and associated photos.
- Database revisions prevent stale dish, photo, profile, and deletion requests from overwriting
  newer edits in another tab. Conflict messages provide a reload action.
- Edit listing visibility, description, cuisine, city, address, timezone, weekly hours and occasions.
- Claim or change an OpenStreetMap listing. Empty profile details can be filled from the map;
  claims include ownership evidence; duplicate listings enter the dispute-review queue.
- Decisions and reviewer notes appear on the owner dashboard and claim page.
- Authorized administrators use `/admin/claims` to review claims, approve/reject with a note,
  explicitly transfer disputed listings, and inspect audit history. They cannot approve their own restaurant.
- Claim destination survives login, registration, and setup.
- Generate and print a restaurant QR code; local-only links have a warning.

## Supporting behavior

- Supabase Row Level Security for restaurant ownership and confirmed diner data.
- Server-side API keys, image-upload checks, Zod validation, AI refusal/truncation handling,
  and shared Supabase request limits with hashed counter keys.
- Cached translations, dish explanations, and map lookups; map upstream requests share a throttle.
- Production service worker caches opened menu documents and My Carte with supporting scripts/styles.
  Cached menu copies explicitly warn that dishes and allergens may have changed.
- Web app manifest, app icon, home-screen launch into My Carte, loading/error/404 pages,
  keyboard focus handling for sheets, and reduced-motion configuration.

## Current limits and next work

- AI still requires owner review, including the detected source language. Fixed allergy/staff
  translations cover seven languages; unsupported staff languages fall back to English.
- Offline support is a saved snapshot. AI calls, fresh translations, searches, and new scans require
  internet. Visible menus poll confirmed data every 30 seconds and on focus/reconnection;
  this is not an instantaneous subscription. Menu changes clear stale orders/assistant panels while
  retaining allergy filters, language, and display settings. Refresh failures show a staff-confirmation notice.
- Public navigation/footer copy is still English, and the language selector lives on diner menus.
- Claims require independent human ownership verification through the admin queue. The database
  administrator must provision reviewer accounts. Decisions are shown in-app; email/SMS delivery is not configured.
- My Carte is device/browser-local with portable backup and restore. Cross-device transfers are
  explicit file transfers, with no automatic cloud sync or account requirement.
- Restaurant management is one owner/one restaurant. Staff roles and multiple locations are absent.
- Bill currency is inferred from price symbols; mixed-currency bills and full currency-specific
  rounding are not supported. It is an estimate, not a checkout or payment system.
- No reservations, delivery, POS integration, customer payment, or kitchen ticket workflow.
- Deployments must apply new Supabase migrations before running code that expects the new columns
  and routines. See `DEPLOYMENT.md` for this update and administrator provisioning.
- A real browser/device smoke test is still needed for email recovery, camera formats, voice permission,
  printing, home-screen installation, offline transitions, and real provider failures.
