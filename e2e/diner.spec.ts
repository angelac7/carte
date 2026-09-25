import { expect, test } from "@playwright/test";
import { createOwner, createRestaurant, deleteOwner, dishCard, type TempOwner } from "./helpers";

let owner: TempOwner;
let slug: string;

test.beforeAll(async () => {
  owner = await createOwner();
  ({ slug } = await createRestaurant(owner, [
    { name: "Peanut Noodles", price: "$14", allergens: ["peanuts", "wheat"], section: "Noodles" },
    { name: "Green Salad", price: "$9", section: "Starters" },
  ]));
});
test.afterAll(() => deleteOwner(owner));

test("public pages load without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/", "/discover", "/places", "/scan", "/my", "/privacy", "/terms"]) {
    // Don't wait for hero photos: this checks that each page renders, not image loading.
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), path).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("a diner's allergy filter hides dishes that contain it", async ({ page }) => {
  await page.goto(`/r/${slug}`);
  await expect(dishCard(page, "Peanut Noodles")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Noodles", level: 2 })).toBeVisible();
  await page.getByRole("button", { name: "Allergies & diet" }).click();
  const filters = page.getByRole("dialog");
  await filters.getByRole("button", { name: "peanuts", exact: true }).click();
  await filters.getByRole("button", { name: /^Show/ }).click();
  await expect(dishCard(page, "Peanut Noodles")).toHaveCount(0);
  await expect(dishCard(page, "Green Salad")).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove No peanuts" })).toBeVisible();
});

test("the allergy card tells staff about a severe allergy", async ({ page }) => {
  await page.goto(`/r/${slug}`);
  await page.getByRole("button", { name: "Allergies", exact: true }).click();
  const card = page.getByRole("dialog");
  await card.getByRole("button", { name: "sesame", exact: true }).click();
  await card.getByRole("button", { name: "Severe allergy" }).click();
  await expect(card.getByText("I have a food allergy to:").first()).toBeVisible();
  await expect(card.getByText(/even a trace can make me very ill/).first()).toBeVisible();
});
