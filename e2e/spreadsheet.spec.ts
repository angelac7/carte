import { expect, test } from "@playwright/test";
import {
  createOwner,
  createRestaurant,
  deleteOwner,
  dishCard,
  logIn,
  rest,
  type TempOwner,
} from "./helpers";

let owner: TempOwner;
test.beforeAll(async () => {
  owner = await createOwner();
});
test.afterAll(() => deleteOwner(owner));

test("an owner edits the menu in a spreadsheet and uploads it", async ({ page }) => {
  const { id, slug } = await createRestaurant(owner, [
    { name: "Peanut Noodles", price: "$14", allergens: ["peanuts"] },
    { name: "Green Salad", price: "$9" },
  ]);
  await logIn(page, owner);

  const download = await page.request.get("/api/menu-spreadsheet");
  expect(download.headers()["content-type"]).toContain("text/csv");
  const csv = (await download.text()).replace("$9", "$10").concat(",,Iced Tea,,$3\r\n");

  await page.goto("/dashboard/spreadsheet");
  await page.getByLabel("Spreadsheet file").setInputFiles({
    name: "menu.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(page.getByText("1 new dish: Iced Tea")).toBeVisible();
  await expect(page.getByText(/Green Salad\s*\(price\)/)).toBeVisible();
  await expect(page.getByText("1 dish is unchanged.")).toBeVisible();
  await page.getByRole("button", { name: "Import 2 changes" }).click();
  await expect(page.getByText("Imported.")).toBeVisible();

  const dishes = await rest<{ name: string; price: string; confirmed: boolean }[]>(
    `menu_items?restaurant_id=eq.${id}&select=name,price,confirmed&order=sort_order`,
  );
  expect(dishes).toEqual([
    { name: "Peanut Noodles", price: "$14", confirmed: true },
    { name: "Green Salad", price: "$10", confirmed: false },
    { name: "Iced Tea", price: "$3", confirmed: false },
  ]);

  // Changed dishes wait for the owner to check them again.
  await page.goto(`/r/${slug}`);
  await expect(dishCard(page, "Peanut Noodles")).toBeVisible();
  await expect(dishCard(page, "Green Salad")).toHaveCount(0);
});

test("a spreadsheet with mistakes changes nothing", async ({ page }) => {
  await createRestaurant(owner, [{ name: "Soup", price: "$6" }], "Second Kitchen");
  await logIn(page, owner);
  await page.goto("/dashboard/spreadsheet");
  await page.getByLabel("Spreadsheet file").setInputFiles({
    name: "menu.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name,allergens\nSoup,kiwi\n"),
  });
  await expect(page.getByText("Row 2: Unknown allergen “kiwi”.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Import/ })).toHaveCount(0);
});
