import { expect, test } from "@playwright/test";
import {
  createOwner,
  deleteOwner,
  dishCard,
  logIn,
  placeholderExplanations,
  rest,
  type TempOwner,
} from "./helpers";

let owner: TempOwner;

test.beforeAll(async () => {
  owner = await createOwner();
});
test.afterAll(() => deleteOwner(owner));

test("a new owner sets up, adds and confirms a dish, and diners see it", async ({ page }) => {
  await logIn(page, owner);
  await page.goto("/dashboard/setup");
  const slug = `e2e-${Date.now().toString(36)}`;
  await page.getByLabel("Restaurant name").fill("Test Kitchen");
  await page.getByLabel("Menu link").fill(slug);
  await page.getByRole("button", { name: "Create restaurant" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/dashboard/review");
  await page.getByRole("button", { name: "Add a dish" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Dish name").fill("Butter Chicken");
  await sheet.getByLabel("Price").fill("$18");
  await sheet.getByRole("button", { name: "Add dish" }).click();
  await expect(page.getByRole("heading", { name: "Butter Chicken" })).toBeVisible();

  await page.getByRole("button", { name: "milk", exact: true }).click();
  await expect(page.getByRole("button", { name: "milk", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Saved explanations stand in for AI-written ones, so the test doesn't call the AI.
  const [dish] = await rest<
    { id: string; name: string; description: string; notes: string; source_language: string }[]
  >(
    `menu_items?name=eq.Butter%20Chicken&restaurant_id=in.(${(await rest<{ id: string }[]>(`restaurants?slug=eq.${slug}&select=id`))[0].id})&select=id,name,description,notes,source_language`,
  );
  await placeholderExplanations([dish]);
  await page.getByRole("button", { name: "Confirm dish" }).click();
  await expect(page.getByText("✓ Confirmed")).toBeVisible();

  await page.goto(`/r/${slug}`);
  await expect(dishCard(page, "Butter Chicken")).toBeVisible();
  await expect(dishCard(page, "Butter Chicken").getByText("milk")).toBeVisible();
});
