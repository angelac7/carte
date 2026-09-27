import { expect, test } from "@playwright/test";
import { createOwner, createRestaurant, deleteOwner, logIn, rest, type TempOwner } from "./helpers";

let owner: TempOwner;
let dishId: string;

type Dish = { allergens: string[]; addons: { label: string; allergens: string[] }[] };
const dish = async () =>
  (await rest<Dish[]>(`menu_items?id=eq.${dishId}&select=allergens,addons`))[0];
const edit = (change: object) =>
  rest(`menu_items?id=eq.${dishId}`, { method: "PATCH", body: JSON.stringify(change) });

test.beforeAll(async () => {
  owner = await createOwner();
  const { dishes } = await createRestaurant(owner, [
    { name: "Ramen", price: "$15", allergens: ["wheat"] },
  ]);
  dishId = dishes[0].id;
  await edit({ addons: [{ label: "Add egg", price: "2", allergens: ["eggs"] }] });
  await edit({ addons: [{ label: "Add egg", price: "2", allergens: ["eggs", "milk"] }] });
});
test.afterAll(() => deleteOwner(owner));

test("going back to an earlier version never undoes a newer change", async ({ page }) => {
  await logIn(page, owner);
  await page.goto("/dashboard/history");
  // A teammate changes the dish while this page is open.
  await edit({ allergens: ["wheat", "sesame"] });
  await page.getByRole("button", { name: "Go back to this version" }).first().click();
  await expect(page.getByText("This dish changed after you opened its history")).toBeVisible();
  expect((await dish()).allergens).toEqual(["wheat", "sesame"]);
});

test("going back to an earlier version brings back its add-on allergens too", async ({ page }) => {
  await logIn(page, owner);
  await page.goto("/dashboard/history");
  // Newest first: the teammate's change, both add-on changes, then the dish being added.
  const versions = page.locator("main ol > li");
  await versions.nth(2).getByRole("button", { name: "Go back to this version" }).click();
  await expect(page.getByText("The earlier allergens are back.")).toBeVisible();
  expect(await dish()).toEqual({
    allergens: ["wheat"],
    addons: [{ label: "Add egg", price: "2", allergens: ["eggs"] }],
  });
});
