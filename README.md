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
