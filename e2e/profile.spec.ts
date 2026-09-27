import { expect, test } from "@playwright/test";
import { createOwner, createRestaurant, deleteOwner, logIn, rest, type TempOwner } from "./helpers";

let owner: TempOwner;
let restaurantId: string;

test.beforeAll(async () => {
  owner = await createOwner();
  ({ id: restaurantId } = await createRestaurant(owner, [{ name: "Ramen", price: "$15" }]));
});
test.afterAll(() => deleteOwner(owner));

test("an owner saves their profile, including accessibility and currency", async ({ page }) => {
  await logIn(page, owner);
  await page.goto("/dashboard/profile");
  await page.getByLabel("Short description").fill("Noodles and small plates.");
  await page.getByText("Quiet space", { exact: true }).click();
  await page.getByLabel("Menu currency").selectOption("USD");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  const [saved] = await rest<{ description: string; features: string[]; currency: string }[]>(
    `restaurants?id=eq.${restaurantId}&select=description,features,currency`,
  );
  expect(saved).toEqual({
    description: "Noodles and small plates.",
    features: ["quiet"],
    currency: "USD",
  });
});
