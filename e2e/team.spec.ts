import { expect, test } from "@playwright/test";
import { createOwner, createRestaurant, deleteOwner, logIn, type TempOwner } from "./helpers";

let owner: TempOwner;
let editor: TempOwner;

test.beforeAll(async () => {
  [owner, editor] = await Promise.all([createOwner(), createOwner()]);
  await createRestaurant(
    owner,
    [{ name: "Peanut Noodles", price: "$14", allergens: ["peanuts"], section: "Noodles" }],
    "North Kitchen",
  );
  await createRestaurant(owner, [{ name: "Green Salad", price: "$9" }], "South Kitchen");
});
test.afterAll(async () => {
  await deleteOwner(editor);
  await deleteOwner(owner);
});

test("an owner with two locations switches between them", async ({ page }) => {
  await logIn(page, owner);
  await page.goto("/dashboard");
  const location = page.getByLabel("Location");
  const shown = await page.getByRole("heading", { level: 1 }).textContent();
  const other = shown?.includes("North") ? "South Kitchen" : "North Kitchen";
  await location.selectOption({ label: other });
  await expect(page.getByRole("heading", { level: 1, name: other })).toBeVisible();
});

test("the printed menu lists confirmed dishes with their allergens", async ({ page }) => {
  await logIn(page, owner);
  await page.goto("/dashboard");
  await page.getByLabel("Location").selectOption({ label: "North Kitchen" });
  await expect(page.getByRole("heading", { level: 1, name: "North Kitchen" })).toBeVisible();
  await page.goto("/dashboard/print");
  await expect(page.getByRole("heading", { level: 2, name: "Noodles" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Peanut Noodles" })).toBeVisible();
  await expect(page.getByText("Contains: Peanuts")).toBeVisible();
});

test("an invited editor can work on the menu but not the team", async ({ browser }) => {
  const ownerPage = await (await browser.newContext()).newPage();
  await logIn(ownerPage, owner);
  await ownerPage.goto("/dashboard");
  await ownerPage.getByLabel("Location").selectOption({ label: "North Kitchen" });
  await expect(ownerPage.getByRole("heading", { level: 1, name: "North Kitchen" })).toBeVisible();
  await ownerPage.goto("/dashboard/team");
  await ownerPage.getByRole("button", { name: "Create invite link" }).click();
  const link = await ownerPage.getByText(/\/join\/[a-z2-9]{12}/).textContent();
  const code = link!.match(/\/join\/([a-z2-9]{12})/)![1];

  const editorPage = await (await browser.newContext()).newPage();
  await logIn(editorPage, editor);
  await editorPage.goto(`/join/${code}`);
  await expect(editorPage.getByRole("heading", { name: "Join North Kitchen" })).toBeVisible();
  await editorPage.getByRole("button", { name: "Join as an editor" }).click();
  await expect(editorPage).toHaveURL(/\/dashboard$/);
  await expect(editorPage.getByRole("heading", { level: 1, name: "North Kitchen" })).toBeVisible();

  // Editors see the menu, but the team page is for the owner only.
  await editorPage.goto("/dashboard/review");
  await expect(editorPage.getByText("Peanut Noodles").first()).toBeVisible();
  await expect(editorPage.getByRole("link", { name: "Team", exact: true })).toHaveCount(0);
  await editorPage.goto("/dashboard/team");
  await expect(editorPage).toHaveURL(/\/dashboard$/);

  // Each invite works once.
  await editorPage.goto(`/join/${code}`);
  await expect(
    editorPage.getByRole("heading", { name: "This invite can't be used" }),
  ).toBeVisible();

  await ownerPage.reload();
  await expect(ownerPage.getByText(editor.email)).toBeVisible();
});
