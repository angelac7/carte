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
