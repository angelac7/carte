import { expect, test } from "@playwright/test";
import {
  createOwner,
  createRestaurant,
  deleteOwner,
  logIn,
  publicRest,
  rest,
  type TempOwner,
} from "./helpers";

let admin: TempOwner;
let owner: TempOwner;
let slug: string;
let restaurantId: string;

test.beforeAll(async () => {
  [admin, owner] = await Promise.all([createOwner(), createOwner()]);
  await rest("carte_admins", { method: "POST", body: JSON.stringify({ user_id: admin.id }) });
  ({ slug, id: restaurantId } = await createRestaurant(owner, [
    { name: "Green Salad", price: "$9" },
  ]));
});
test.afterAll(async () => {
  await deleteOwner(owner);
  await deleteOwner(admin);
});

test("the admin page is only for Carte administrators", async ({ page }) => {
  await logIn(page, owner);
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});

test("an administrator suspends a menu, which hides it from diners, then restores it", async ({
  browser,
}) => {
  const adminPage = await (await browser.newContext()).newPage();
  await logIn(adminPage, admin);
  await adminPage.goto("/admin");
  const row = adminPage.getByRole("row").filter({ hasText: `/r/${slug}` });
  await expect(row).toContainText("1 of 1 confirmed");
  await row.getByRole("button", { name: "Suspend" }).click();
  await expect(row).toContainText("Suspended");
  // Gone even for someone asking the database directly with the public key.
  expect(await publicRest(`restaurants?slug=eq.${slug}&select=id`)).toEqual([]);
  expect(await publicRest(`menu_items?restaurant_id=eq.${restaurantId}&select=id`)).toEqual([]);

  // The menu page streams, so a missing menu shows the not-found page rather than a 404 status.
  const diner = await (await browser.newContext()).newPage();
  await diner.goto(`/r/${slug}`);
  await expect(diner.getByRole("heading", { name: "This page isn’t on the menu" })).toBeVisible();
  await expect(diner.getByText("Green Salad")).toHaveCount(0);

  const ownerPage = await (await browser.newContext()).newPage();
  await logIn(ownerPage, owner);
  await ownerPage.goto("/dashboard");
  await expect(ownerPage.getByRole("alert").filter({ hasText: "suspended" })).toBeVisible();

  await row.getByRole("button", { name: "Restore" }).click();
  await expect(row).toContainText("Menu link only");
  await diner.goto(`/r/${slug}`);
  await expect(diner.getByRole("heading", { name: "Green Salad", level: 3 })).toBeVisible();
});

test("administrators see how much AI each restaurant used", async ({ browser }) => {
  await rest("ai_usage", {
    method: "POST",
    body: JSON.stringify({ restaurant_id: restaurantId, feature: "chat", calls: 7 }),
  });
  const ownerPage = await (await browser.newContext()).newPage();
  await logIn(ownerPage, owner);
  expect((await ownerPage.goto("/admin/ai"))?.status()).toBe(404);

  const adminPage = await (await browser.newContext()).newPage();
  await logIn(adminPage, admin);
  await adminPage.goto("/admin/ai");
  const row = adminPage.getByRole("row").filter({ hasText: "Test Kitchen" });
  await expect(row).toContainText("7 of 500");
  await expect(row).toContainText("Menu assistant");
});
