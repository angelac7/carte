import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

// Browser tests talk to the same Supabase project as the app, with the secret key from
// .env.local, and remove everything they create.
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()]),
);
const base = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;
const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
};

export async function rest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, Prefer: "return=representation", ...(init.headers ?? {}) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${text}`);
  return (text ? JSON.parse(text) : null) as T;
}

export type TempOwner = { id: string; email: string; password: string };

export async function createOwner(): Promise<TempOwner> {
  const email = `e2e-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = `E2e-${randomBytes(8).toString("hex")}-9`;
  const response = await fetch(`${base}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const user = (await response.json()) as { id?: string };
  if (!user.id) throw new Error("Couldn't create a test account");
  return { id: user.id, email, password };
}

/** Removes a test account; the database removes its restaurants and dishes with it. */
export async function deleteOwner(owner: TempOwner | undefined) {
  if (!owner) return;
  await fetch(`${base}/auth/v1/admin/users/${owner.id}`, { method: "DELETE", headers });
  await rest(`restaurants?owner_id=eq.${owner.id}`, { method: "DELETE" }).catch(() => {});
}

export type TestDish = { name: string; price: string; allergens?: string[]; section?: string };

/** A restaurant with confirmed dishes and placeholder explanations, so no AI is called. */
export async function createRestaurant(owner: TempOwner, dishes: TestDish[]) {
  const slug = `e2e-${randomBytes(4).toString("hex")}`;
  const [restaurant] = await rest<{ id: string }[]>("restaurants", {
    method: "POST",
    body: JSON.stringify({ owner_id: owner.id, name: "Test Kitchen", slug }),
  });
  const rows = await rest<
    { id: string; name: string; description: string; notes: string; source_language: string }[]
  >("menu_items", {
    method: "POST",
    body: JSON.stringify(
      dishes.map((dish, index) => ({
        restaurant_id: restaurant.id,
        name: dish.name,
        price: dish.price,
        description: "",
        allergens: dish.allergens ?? [],
        dietary_tags: [],
        section: dish.section ?? "",
        sort_order: index + 1,
        confirmed: true,
        allergen_list: 2,
      })),
    ),
  });
  await placeholderExplanations(rows);
  return { id: restaurant.id, slug, dishes: rows };
}

/** Saved explanations for dishes, so the app doesn't write real ones during a test. */
export async function placeholderExplanations(
  dishes: {
    id: string;
    name: string;
    description: string;
    notes: string;
    source_language: string;
  }[],
) {
  const hash = (d: (typeof dishes)[number]) =>
    createHash("sha256")
      .update(JSON.stringify([d.name, d.description, d.notes, d.source_language ?? "und"]))
      .digest("hex");
  await rest("dish_insights", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(
      dishes.map((d) => ({
        menu_item_id: d.id,
        language: "en",
        source_hash: hash(d),
        insight: { summary: `About ${d.name}.`, format: 2 },
      })),
    ),
  });
}

export async function logIn(page: Page, owner: TempOwner) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(owner.email);
  await page.getByLabel("Password").fill(owner.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** The card for one dish on the diner menu. */
export const dishCard = (page: Page, name: string) =>
  page.locator("main li").filter({ has: page.getByRole("heading", { name, level: 3 }) });
