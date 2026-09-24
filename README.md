# Carte

Carte turns a restaurant's menu photo into a confirmed, multilingual allergen guide.
Owners upload a menu, AI suggests allergens, and owners confirm every dish before diners see it.

## Setup

1. Install Node.js 20.19+ and run `npm install`.
2. Copy `.env.example` to `.env.local` and add your Anthropic API key.
3. Run `npm run dev` and open http://localhost:3000.

## Scripts

| Command                       | What it does                         |
| ----------------------------- | ------------------------------------ |
| `npm run dev`                 | Start the development server         |
| `npm run build` / `npm start` | Build and run the production version |
| `npm test`                    | Run unit tests                       |
| `npm run lint`                | Check code with ESLint               |
| `npm run typecheck`           | Check TypeScript types               |
| `npm run format`              | Format code with Prettier            |

## Project structure

| Folder             | Holds                                         |
| ------------------ | --------------------------------------------- |
| `app/`             | Pages and API routes                          |
| `components/`      | Reusable UI pieces                            |
| `lib/ai/`          | AI prompts and calls                          |
| `lib/db/`          | Data storage (a JSON file for now)            |
| `lib/allergens.ts` | The single list of allergens and dietary tags |
| `types/`           | Shared types and validation schemas           |
| `tests/`           | Unit tests                                    |

## Safety rule

AI output is only a suggestion. Diners must only ever see dishes an owner has confirmed.

## Pages

| Page      | Who   | What it does                                          |
| --------- | ----- | ----------------------------------------------------- |
| `/`       | Owner | Upload a menu photo and save dishes                   |
| `/review` | Owner | Confirm allergens and tags for each dish              |
| `/qr`     | Owner | Print a table QR code linking to the diner menu       |
| `/menu`   | Diner | Confirmed dishes only, with allergen and diet filters |

## Languages

The diner menu supports English, Spanish, Chinese, Korean, Japanese, French, and Vietnamese.
Page text and allergen names use fixed translations in `lib/i18n/diner-strings.ts`.
Dish text is translated by AI once per language and saved in `data/translations.json`;
editing a dish triggers a fresh translation of that dish only.

## Menu chat

Diners can ask questions on the menu page. Answers use only confirmed dishes, reply in the
diner's language, and send preparation or cross-contamination questions to staff.
Limits: 20 questions per 10 minutes per visitor, 30 menu uploads per hour, 500 characters per question.
Rate limits are in memory for now and must move to a shared store before launch.

## Accounts and database

Carte stores restaurants, dishes, and translations in Supabase. The schema and Row Level Security
rules live in `supabase/migrations/`. Owners sign up, create one restaurant, and manage it at
`/dashboard`. Diners open each restaurant's menu at `/r/<menu-link>`.

| Page                | Who      | What it does                                       |
| ------------------- | -------- | -------------------------------------------------- |
| `/`                 | Everyone | Landing page                                       |
| `/login`, `/signup` | Owners   | Log in or create an account                        |
| `/dashboard/setup`  | Owners   | Name the restaurant and choose its menu link       |
| `/dashboard`        | Owners   | Upload a menu photo                                |
| `/dashboard/review` | Owners   | Confirm allergens and tags                         |
| `/dashboard/qr`     | Owners   | Print the table QR code                            |
| `/r/<menu-link>`    | Diners   | Confirmed dishes with filters, languages, and chat |

## Dish details

Diners tap "Details" on any dish for an AI explanation in their language: what it is, taste,
background, ingredients to know, spice and richness, portion, pairings, and questions for the
kitchen. Explanations are generated once per dish and language, saved in `dish_insights`, and
regenerated when the owner edits the dish. They never include allergens.

## At the table

Diners can build an order, show it to staff in English with their allergies, split the bill
with tax and tip, and show a translated allergy card. Allergy and diet filters are saved on the
diner's device in the `carte-prefs` cookie and applied at every Carte menu. No diner account is needed.

## Help me choose

"What should I order?" suggests 2 to 5 dishes from those that pass the diner's filters, based on
hunger, spice tolerance, party size, and budget. Owners can label dishes halal, kosher,
pregnancy-friendly, or kid-friendly; the AI never suggests these. The menu chat accepts voice
questions and reads answers aloud, and diners can turn on larger text and high contrast, saved
on their device.

## Discover

`/discover` lets anyone search confirmed dishes and listed restaurants, filtered by saved allergy
and diet filters, open now, occasion, and city. If a phrase finds no dishes, AI turns the craving
into dish words and searches again. Trending counts anonymous dish views from the last 7 days.
Owners fill in their profile and opt in to listing at `/dashboard/profile`.

## My Carte

Diners can save dishes and menus, keep a food diary with star ratings and notes, track challenges,
and create an AI taste profile at `/my`. All of it is stored on the diner's device (localStorage);
the taste profile request sends only the diner's own ratings and stores nothing. In production, a
service worker keeps opened menus, My Carte, and the allergy card available offline, and Carte can
be added to the home screen.
