import { expect, test } from "@playwright/test";
import {
  createOwner,
  createRestaurant,
  deleteOwner,
  dishCard,
  rest,
  type TempOwner,
} from "./helpers";

let owner: TempOwner;
let slug: string;
let restaurantId: string;

test.beforeAll(async () => {
  owner = await createOwner();
  ({ slug, id: restaurantId } = await createRestaurant(owner, [
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

test("only menus on Discover describe themselves to Google", async ({ page }) => {
  const structuredData = page.locator('script[type="application/ld+json"]');
  await page.goto(`/r/${slug}`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(structuredData).toHaveCount(0);

  await rest(`restaurants?id=eq.${restaurantId}`, {
    method: "PATCH",
    body: JSON.stringify({ listed: true }),
  });
  await page.goto(`/r/${slug}`);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const data = JSON.parse((await structuredData.textContent()) ?? "{}");
  expect(data["@type"]).toBe("Restaurant");
  expect(data.hasMenu.hasMenuSection.map((section: { name: string }) => section.name)).toEqual([
    "Noodles",
    "Starters",
  ]);
  expect(JSON.stringify(data)).not.toMatch(/allergen|wheat/i);
});

test("the kitchen's practices show, with the ones about the diner's allergies first", async ({
  page,
}) => {
  await rest(`restaurants?id=eq.${restaurantId}`, {
    method: "PATCH",
    body: JSON.stringify({ kitchen_practices: ["shared-fryer", "nuts-in-kitchen"] }),
  });
  await page.goto(`/r/${slug}`);
  const kitchen = page.getByRole("note").filter({ hasText: "About this kitchen" });
  await expect(kitchen).toContainText("Fried foods share one fryer.");
  const order = async () => {
    const text = (await kitchen.textContent()) ?? "";
    return text.indexOf("Peanuts and tree nuts") < text.indexOf("Fried foods");
  };
  expect(await order()).toBe(false);

  await page.getByRole("button", { name: "Allergies & diet" }).click();
  const filters = page.getByRole("dialog");
  await filters.getByRole("button", { name: "peanuts", exact: true }).click();
  await filters.getByRole("button", { name: /^Show/ }).click();
  await expect.poll(order).toBe(true);
});

test("diners can hide pork, and see which dishes haven't been checked for it", async ({ page }) => {
  const [noodles, salad] = await rest<{ id: string; name: string }[]>(
    `menu_items?restaurant_id=eq.${restaurantId}&select=id,name&order=sort_order`,
  );
  // Marking it unconfirms the dish, like any allergen change, so confirm it again after.
  await rest(`menu_items?id=eq.${noodles.id}`, {
    method: "PATCH",
    body: JSON.stringify({ also_contains: ["pork"] }),
  });
  await rest(`menu_items?id=eq.${noodles.id}`, {
    method: "PATCH",
    body: JSON.stringify({ also_checked: true, confirmed: true }),
  });
  expect(salad.name).toBe("Green Salad");

  await page.goto(`/r/${slug}`);
  await expect(dishCard(page, "Peanut Noodles").getByText("Also contains")).toBeVisible();
  await page.getByRole("button", { name: "Allergies & diet" }).click();
  const filters = page.getByRole("dialog");
  await filters.getByRole("button", { name: "pork", exact: true }).click();
  await filters.getByRole("button", { name: /^Show/ }).click();
  await expect(dishCard(page, "Peanut Noodles")).toHaveCount(0);
  await expect(dishCard(page, "Green Salad")).toContainText(
    "The restaurant hasn't said whether this has pork. Ask your server.",
  );
  await expect(page.getByRole("button", { name: "Remove No pork" })).toBeVisible();
});

test("calories show on the dish, with the daily note", async ({ page }) => {
  const [salad] = await rest<{ id: string }[]>(
    `menu_items?restaurant_id=eq.${restaurantId}&name=eq.Green%20Salad&select=id`,
  );
  // Setting calories unconfirms the dish, like a price change, so confirm it again after.
  await rest(`menu_items?id=eq.${salad.id}`, {
    method: "PATCH",
    body: JSON.stringify({ calories: 1250 }),
  });
  await rest(`menu_items?id=eq.${salad.id}`, {
    method: "PATCH",
    body: JSON.stringify({ confirmed: true }),
  });
  await page.goto(`/r/${slug}`);
  await expect(dishCard(page, "Green Salad")).toContainText("1,250 cal");
  await expect(
    page.getByText("2,000 calories a day is used for general nutrition advice"),
  ).toBeVisible();
});

test("accessibility info shows on the menu and filters Discover", async ({ page }) => {
  await rest(`restaurants?id=eq.${restaurantId}`, {
    method: "PATCH",
    body: JSON.stringify({ listed: true, features: ["step-free-entry", "high-chairs"] }),
  });
  await page.goto(`/r/${slug}`);
  await expect(page.locator("header li").filter({ hasText: "Step-free entrance" })).toBeVisible();

  await page.goto("/discover?type=restaurants&filters=1&feature=step-free-entry");
  await expect(page.getByRole("heading", { name: "Test Kitchen", level: 3 })).toBeVisible();
  await page.goto("/discover?type=restaurants&filters=1&feature=quiet");
  await expect(page.getByRole("heading", { name: "Test Kitchen", level: 3 })).toHaveCount(0);
});

test("diners can see approximate prices in their own currency", async ({ page }) => {
  await page.goto(`/r/${slug}`);
  await page.getByRole("button", { name: "Display" }).click();
  await page.getByLabel("Also show prices in").selectOption("JPY");
  await expect(page.getByText(/European Central Bank rates/)).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(dishCard(page, "Green Salad")).toContainText(/≈ [¥￥][\d,]+/);

  // Remembered on this device.
  await page.reload();
  await expect(dishCard(page, "Green Salad")).toContainText(/≈ [¥￥][\d,]+/);
});
