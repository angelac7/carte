import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  createOwner,
  createRestaurant,
  deleteOwner,
  logIn,
  placeholderExplanations,
  rest,
  type TempOwner,
} from "./helpers";

let owner: TempOwner;
let slug: string;
let restaurantId: string;

test.beforeAll(async () => {
  owner = await createOwner();
  ({ slug, id: restaurantId } = await createRestaurant(owner, [
    { name: "Tomato Soup", price: "$8" },
    { name: "Pancakes", price: "$11" },
  ]));
});
test.afterAll(() => deleteOwner(owner));

const dinerSees = async (page: Page, name: string, visible: boolean) => {
  await page.goto(`/r/${slug}`);
  await expect(page.getByRole("heading", { name: "Tomato Soup", level: 3 })).toBeVisible();
  await expect(page.getByRole("heading", { name, level: 3 })).toHaveCount(visible ? 1 : 0);
};

test("a seasonal menu hides its dishes from diners while it's switched off", async ({
  browser,
}) => {
  const ownerPage = await (await browser.newContext()).newPage();
  const diner = await (await browser.newContext()).newPage();
  await logIn(ownerPage, owner);
  await ownerPage.goto("/dashboard/menus");
  await ownerPage.getByLabel("New seasonal menu").fill("Brunch");
  await ownerPage.getByRole("button", { name: "Add", exact: true }).click();
  const brunch = ownerPage.getByRole("region", { name: "Brunch" });
  await brunch.locator("summary", { hasText: "Choose dishes" }).click();
  await brunch.getByLabel("Pancakes").check();
  await brunch.getByRole("button", { name: "Save dishes" }).click();
  await expect(brunch).toContainText("1 dish");

  await brunch.getByRole("button", { name: "Switch off" }).click();
  await expect(brunch).toContainText("Hidden from diners.");
  await dinerSees(diner, "Pancakes", false);
  await ownerPage.goto("/dashboard/review");
  await expect(ownerPage.locator("article").filter({ hasText: "Pancakes" })).toContainText(
    "Hidden: its seasonal menu is off",
  );

  await ownerPage.goto("/dashboard/menus");
  await brunch.getByRole("button", { name: "Switch on" }).click();
  await expect(brunch).toContainText("Diners see these dishes.");
  await dinerSees(diner, "Pancakes", true);
});

test("a draft stays hidden until it's published in place of the current menu", async ({
  browser,
}) => {
  const stewRows = await rest<
    { id: string; name: string; description: string; notes: string; source_language: string }[]
  >("menu_items", {
    method: "POST",
    body: JSON.stringify({
      restaurant_id: restaurantId,
      name: "Winter Stew",
      price: "$16",
      source_language: "en",
      allergens: [],
      dietary_tags: [],
      draft: true,
      sort_order: 10,
    }),
  });
  // Saved explanations, so publishing never asks the AI to write one.
  await placeholderExplanations(stewRows);
  const ownerPage = await (await browser.newContext()).newPage();
  const diner = await (await browser.newContext()).newPage();
  await logIn(ownerPage, owner);
  await ownerPage.goto("/dashboard/review");
  await expect(ownerPage.getByText("Your draft has 1 dish, 0 confirmed.")).toBeVisible();
  const stew = ownerPage.locator("article").filter({ hasText: "Winter Stew" });
  await expect(stew).toContainText("Draft");
  await stew.getByRole("button", { name: "Confirm dish" }).click();
  await expect(stew).toContainText("Confirmed for publishing");
  await dinerSees(diner, "Winter Stew", false);

  await ownerPage.getByRole("link", { name: "Publish the draft" }).click();
  await expect(ownerPage.getByText("1 draft dish, 1 confirmed.")).toBeVisible();
  await ownerPage.getByLabel("Replace my current menu").check();
  await ownerPage.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(ownerPage.getByText("Published 1 dish. Diners see it now.")).toBeVisible();

  await diner.goto(`/r/${slug}`);
  await expect(diner.getByRole("heading", { name: "Winter Stew", level: 3 })).toBeVisible();
  await expect(diner.getByRole("heading", { name: "Tomato Soup", level: 3 })).toHaveCount(0);
});

test("the team corrects a translation, and diners see their wording", async ({ browser }) => {
  const ownerPage = await (await browser.newContext()).newPage();
  await logIn(ownerPage, owner);
  await ownerPage.goto("/dashboard/translations?lang=es");
  const stew = ownerPage.locator("form").filter({ hasText: "Winter Stew" });
  await stew.getByLabel("Name").fill("Guiso de invierno");
  await stew.getByRole("button", { name: "Save translation" }).click();
  await expect(ownerPage.getByText("Translation saved.")).toBeVisible();
  await expect(ownerPage.locator("form").filter({ hasText: "Winter Stew" })).toContainText(
    "Corrected by your team",
  );

  // Every dish on this menu has a translation now, so this never calls the AI.
  const diner = await (await browser.newContext({ locale: "es-ES" })).newPage();
  await diner
    .context()
    .addCookies([{ name: "carte-language", value: "es", url: "http://localhost:3000" }]);
  await diner.goto(`/r/${slug}`);
  await expect(diner.getByRole("heading", { name: "Guiso de invierno", level: 3 })).toBeVisible();
});

test("a backup downloads everything and restores it as a draft", async ({ browser }) => {
  const [brunch] = await rest<{ id: string }[]>(
    `dish_groups?restaurant_id=eq.${restaurantId}&name=eq.Brunch&select=id`,
  );
  await rest(`menu_items?restaurant_id=eq.${restaurantId}&name=eq.Winter%20Stew`, {
    method: "PATCH",
    body: JSON.stringify({ group_id: brunch.id }),
  });
  const ownerPage = await (await browser.newContext()).newPage();
  await logIn(ownerPage, owner);
  await ownerPage.goto("/dashboard/backup");
  const download = ownerPage.waitForEvent("download");
  await ownerPage.getByRole("link", { name: "Download backup" }).click();
  const file = await (await download).path();
  const backup = JSON.parse(readFileSync(file, "utf8"));
  expect(backup.dishes.map((dish: { name: string }) => dish.name)).toEqual(["Winter Stew"]);
  expect(backup.seasonal_menus).toEqual([{ name: "Brunch", active: true }]);
  expect(backup.dishes[0]).toMatchObject({
    seasonal_menu: 0,
    translations: { es: { name: "Guiso de invierno" } },
  });

  await ownerPage.getByLabel("Backup file").setInputFiles(file);
  await ownerPage.getByRole("button", { name: "Restore" }).click();
  await expect(ownerPage.getByText("Restored 1 dish as a draft.")).toBeVisible();
  const drafts = await rest<{ id: string; name: string; confirmed: boolean; group_id: string }[]>(
    `menu_items?restaurant_id=eq.${restaurantId}&draft=eq.true&select=id,name,confirmed,group_id`,
  );
  // Back in the same seasonal menu, unconfirmed, with the team's corrected wording.
  expect(drafts).toEqual([
    { id: drafts[0].id, name: "Winter Stew", confirmed: false, group_id: brunch.id },
  ]);
  const [translation] = await rest<{ name: string }[]>(
    `translations?menu_item_id=eq.${drafts[0].id}&language=eq.es&select=name`,
  );
  expect(translation.name).toBe("Guiso de invierno");
  // A second restore waits until this draft is published or thrown away.
  await ownerPage.goto("/dashboard/backup");
  await ownerPage.getByLabel("Backup file").setInputFiles(file);
  await ownerPage.getByRole("button", { name: "Restore" }).click();
  await expect(ownerPage.getByText("You already have a draft.")).toBeVisible();
});
