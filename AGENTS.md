<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Carte conventions

- Allergens and dietary tags come only from `lib/allergens.ts`. Never hardcode the list.
- AI prompts and calls live in `lib/ai/`, one file per task. Validate all AI output with Zod schemas in `types/`.
- Data access goes through `lib/db/`. Pages and API routes stay thin.
- Reuse components from `components/` before writing new UI.
- camelCase for functions and variables, PascalCase for components and types.
- Any edit to a dish sets `confirmed: false`. Only confirmed dishes may be shown to diners.
- Never commit `.env.local` or `/data`. Never expose API keys to the browser.
- Build one feature at a time on its own branch, with tests for new logic.
- Diner page text comes from `lib/i18n/diner-strings.ts`. Allergen and tag names are fixed translations and must never be AI-generated.
- AI calls use the shared client and `parseJsonReply` in `lib/ai/client.ts`.
- Every public route that calls AI must use `checkRateLimit` from `lib/rate-limit.ts` and validate input with Zod.
- The menu assistant must never call a dish "safe" or "free of" an allergen, and must answer only from confirmed dishes.
- Owner pages call `requireRestaurant()` or `requireUser()` from `lib/auth.ts`; owner API routes call `getOwnerContext()` and return 401 when it's null.
- Use the regular Supabase client (`lib/supabase/server.ts`) so Row Level Security applies. The admin client in `lib/supabase/admin.ts` is only for server jobs like saving translations.
- Anything diners see must come from `getConfirmedDishes()`, never `listDishes()`.
- Database changes go in a new file in `supabase/migrations/`, never by editing an old one.
- AI dish explanations must never mention allergens or call a dish safe; allergens always come from owner-confirmed data.
- Diners never need an account. Diner preferences are stored on their device.
- Allergy card and staff-facing text come from `lib/i18n/table-strings.ts` and are never AI-generated.
- Money math lives in `lib/bill.ts` and `lib/prices.ts`, with tests; keep it out of components.
- Use the shared `Sheet` component for new diner panels.
- The AI may only suggest tags in `AI_SUGGESTED_TAGS`. Tags in `OWNER_ONLY_TAGS` are set by owners only.
- Filter dishes with the diner's filters before sending them to any AI feature, so suggestions can't break them.
- Colors are CSS variables in `app/globals.css`; high contrast overrides them there, never in components.
- Discover only shows restaurants with `listed = true` and confirmed dishes; the database search functions enforce this.
- View tracking stores anonymous counts only. Never add personal data to `dish_stats`.
- Diner data (saved dishes, diary, challenges) lives in localStorage through `lib/my-carte-store.ts`. Never send it to the server except for an explicit diner request like the taste profile.
- Keep My Carte logic pure in `lib/my-carte.ts`, with tests.
- If you change `public/sw.js`, bump its `CACHE` name so phones pick up the new version.
