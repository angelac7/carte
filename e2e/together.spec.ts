import { expect, test, type Page } from "@playwright/test";
import { createOwner, createRestaurant, deleteOwner, dishCard, type TempOwner } from "./helpers";

let owner: TempOwner;
let slug: string;

test.beforeAll(async () => {
  owner = await createOwner();
  ({ slug } = await createRestaurant(owner, [
    { name: "Green Salad", price: "$9" },
    { name: "Iced Tea", price: "$3" },
  ]));
});
test.afterAll(() => deleteOwner(owner));

/** The order button in the bottom bar. Its name includes the count, like "Order 1". */
const orderButton = (page: Page) =>
  page.getByRole("navigation", { name: "Menu tools" }).getByRole("button", { name: /^Order\b/ });

test("two diners add to one shared order from their own phones", async ({ browser }) => {
  const first = await (await browser.newContext()).newPage();
  const second = await (await browser.newContext()).newPage();

  await first.goto(`/r/${slug}`);
  await dishCard(first, "Iced Tea").getByRole("button", { name: "Add", exact: true }).click();
  await orderButton(first).click();
  await first.getByRole("dialog").getByRole("button", { name: "Order together" }).click();
  await expect(first).toHaveURL(/table=[a-z2-9]{10}/);

  await second.goto(first.url());
  await orderButton(second).click();
  await expect(second.getByRole("dialog").getByText("Iced Tea")).toBeVisible();
  await second.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await dishCard(second, "Green Salad").getByRole("button", { name: "Add", exact: true }).click();

  await expect(first.getByRole("dialog").getByText("Green Salad")).toBeVisible({ timeout: 20_000 });
});

test("people at a shared table can put everyone's allergies on one card", async ({ browser }) => {
  const first = await (await browser.newContext()).newPage();
  const second = await (await browser.newContext()).newPage();
  const chooseAllergy = async (page: Page, allergen: string) => {
    await page.getByRole("button", { name: "Allergies & diet" }).click();
    const filters = page.getByRole("dialog");
    await filters.getByRole("button", { name: allergen, exact: true }).click();
    await filters.getByRole("button", { name: /^Show/ }).click();
  };

  await first.goto(`/r/${slug}`);
  await chooseAllergy(first, "peanuts");
  await dishCard(first, "Iced Tea").getByRole("button", { name: "Add", exact: true }).click();
  await orderButton(first).click();
  await first.getByRole("dialog").getByRole("button", { name: "Order together" }).click();
  await expect(first).toHaveURL(/table=[a-z2-9]{10}/);
  const sheet = first.getByRole("dialog");
  await sheet.getByLabel("Your name or seat (optional)").fill("Mia");
  await sheet.getByRole("button", { name: "Share mine" }).click();
  await expect(sheet.getByText("Mia (you)")).toBeVisible();

  await second.goto(first.url());
  await chooseAllergy(second, "milk");
  await orderButton(second).click();
  await second.getByRole("dialog").getByRole("button", { name: "Share mine" }).click();

  await expect(sheet.getByText(/Mia \(you\).*Guest 1/)).toBeVisible({ timeout: 20_000 });
  await sheet.getByRole("button", { name: "Show the table's allergy card" }).click();
  const card = sheet.locator("div.border-tomato").filter({ hasText: "Allergies at this table" });
  await expect(card.getByText("Mia", { exact: true })).toBeVisible();
  await expect(card.getByText("peanuts")).toBeVisible();
  await expect(card.getByText("Guest 1", { exact: true })).toBeVisible();
  await expect(card.getByText("milk")).toBeVisible();

  // Stopping takes this phone's allergies off the table.
  await second.getByRole("dialog").getByRole("button", { name: "Stop sharing mine" }).click();
  await expect(card.getByText("milk")).toHaveCount(0, { timeout: 20_000 });
});
