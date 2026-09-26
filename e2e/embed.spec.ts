import { expect, test } from "@playwright/test";
import { createOwner, createRestaurant, deleteOwner, dishCard, type TempOwner } from "./helpers";

let owner: TempOwner;
let slug: string;
test.beforeAll(async () => {
  owner = await createOwner();
  ({ slug } = await createRestaurant(owner, [
    { name: "Peanut Noodles", price: "$14", allergens: ["peanuts"] },
    { name: "Green Salad", price: "$9" },
  ]));
});
test.afterAll(() => deleteOwner(owner));

test("a restaurant's own website can show its menu, and filters work there", async ({
  page,
  baseURL,
}) => {
  // A pretend restaurant website on another domain, framing the embed and the normal menu.
  await page.route("https://restaurant-site.example/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<h1>Our restaurant</h1>
        <iframe id="embed" src="${baseURL}/embed/${slug}" style="width:900px;height:900px"></iframe>
        <iframe id="plain" src="${baseURL}/r/${slug}" style="width:400px;height:300px"></iframe>`,
    }),
  );
  await page.goto("https://restaurant-site.example/");
  const menu = page.frameLocator("#embed");
  await expect(menu.getByRole("heading", { name: "Test Kitchen", level: 1 })).toBeVisible();
  await expect(menu.getByRole("link", { name: /Open on Carte/ })).toHaveAttribute(
    "href",
    `/r/${slug}`,
  );

  // Cookies are usually blocked inside another site's frame; the filters work anyway.
  await menu.getByRole("button", { name: "Allergies & diet" }).click();
  await menu.getByRole("dialog").getByRole("button", { name: "peanuts", exact: true }).click();
  await menu.getByRole("dialog").getByRole("button", { name: /^Show/ }).click();
  await expect(dishCard(menu as never, "Peanut Noodles")).toHaveCount(0);
  await expect(dishCard(menu as never, "Green Salad")).toBeVisible();

  // Everywhere else, Carte refuses to be framed.
  await page.waitForTimeout(1500);
  await expect(page.frameLocator("#plain").getByText("Test Kitchen")).toHaveCount(0);
});
