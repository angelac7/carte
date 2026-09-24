// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/api-client", () => ({
  fetchDishes: vi.fn(),
  saveDishes: vi.fn(),
  deleteAllDishes: vi.fn(),
  updateDish: vi.fn(),
  deleteDish: vi.fn(),
  fetchTranslations: vi.fn(),
  requestTasteProfile: vi.fn(),
  trackDishView: vi.fn(),
}));
vi.mock("@/app/dashboard/profile/actions", () => ({
  saveProfileAction: vi.fn(async () => ({ saved: true })),
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock("@/components/owner/DishPhotoEditor", () => ({ DishPhotoEditor: () => null }));
import ReviewDishes from "@/components/owner/ReviewDishes";
import { ProfileForm } from "@/components/owner/ProfileForm";
import { DinerMenu } from "@/components/DinerMenu";
import { MyCarte } from "@/components/MyCarte";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import { EMPTY_MY_CARTE, saveDiaryEntry } from "@/lib/my-carte";
import { updateMyCarte } from "@/lib/my-carte-store";
import { fetchDishes, saveDishes, requestTasteProfile } from "@/lib/api-client";
import { saveProfileAction } from "@/app/dashboard/profile/actions";
import { DEFAULT_PROFILE } from "@/lib/restaurant-profile";
import { DEFAULT_DISPLAY } from "@/lib/display-prefs";
import { EMPTY_PREFS, writePrefsCookie } from "@/lib/diner-prefs";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { DOCK_STRINGS } from "@/lib/i18n/dock-strings";
import type { MenuItem } from "@/types/menu";
const dish: MenuItem = {
  id: "dish",
  name: "Milk soup",
  description: "Soup",
  price: "$10",
  allergens: ["milk"],
  dietary_tags: [],
  notes: "",
  confirmed: true,
};
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  writePrefsCookie(EMPTY_PREFS);
  vi.mocked(fetchDishes).mockResolvedValue([dish]);
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("does not submit a manually added dish twice while saving", async () => {
  let finish!: (items: MenuItem[]) => void;
  vi.mocked(saveDishes).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(createElement(ReviewDishes));
  fireEvent.click(await screen.findByRole("button", { name: "Add a dish" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Dish name" }), {
    target: { value: "New soup" },
  });
  const submit = screen.getByRole("button", { name: "Add dish" });
  fireEvent.click(submit);
  fireEvent.click(submit);
  expect(saveDishes).toHaveBeenCalledTimes(1);
  await act(async () => finish([{ ...dish, id: "new" }]));
});
it("retains profile values after successful form actions", async () => {
  render(createElement(ProfileForm, { profile: DEFAULT_PROFILE }));
  const city = screen.getByRole("textbox", { name: "City" }) as HTMLInputElement;
  fireEvent.change(city, { target: { value: "Tokyo" } });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByText("Profile saved.");
  expect(saveProfileAction).toHaveBeenCalledOnce();
  expect(city.value).toBe("Tokyo");
});
it("excludes an ordered dish after allergy preferences change", async () => {
  render(
    createElement(DinerMenu, {
      restaurant: { name: "Cafe", slug: "cafe", cuisine: "" },
      dishes: [dish],
      initialLanguage: "en",
      initialPrefs: EMPTY_PREFS,
      initialDisplay: DEFAULT_DISPLAY,
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: TABLE_STRINGS.en.add }));
  act(() => writePrefsCookie({ avoid: ["milk"], onlyTags: [] }));
  fireEvent.click(
    screen.getByRole("button", { name: new RegExp(`^${DOCK_STRINGS.en.order}( [0-9]+)?$`, "i") }),
  );
  await waitFor(() =>
    expect(within(screen.getByRole("dialog")).queryByText("Milk soup")).toBeNull(),
  );
  expect(
    within(screen.getByRole("dialog")).queryByRole("button", { name: TABLE_STRINGS.en.showServer }),
  ).toBeNull();
});

it("warns that an offline menu can contain outdated allergen data", () => {
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
  render(
    createElement(DinerMenu, {
      restaurant: { name: "Cafe", slug: "cafe", cuisine: "" },
      dishes: [dish],
      initialLanguage: "en",
      initialPrefs: EMPTY_PREFS,
      initialDisplay: DEFAULT_DISPLAY,
    }),
  );
  expect(screen.getByRole("alert").textContent).toContain("Offline menu copy");
});

it("does not report a missing clipboard as copied, and clears the displayed taste profile", async () => {
  vi.stubGlobal("navigator", { onLine: true });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  updateMyCarte(() =>
    [1, 2, 3].reduce(
      (state, id) =>
        saveDiaryEntry(
          state,
          {
            dishId: String(id),
            name: "Soup",
            description: "",
            price: "$10",
            cuisine: "French",
            restaurantName: "Cafe",
            restaurantSlug: "cafe",
          },
          4,
          "",
          Date.now(),
        ),
      EMPTY_MY_CARTE,
    ),
  );
  vi.mocked(requestTasteProfile).mockResolvedValue({
    summary: "Personal taste summary",
    loves: [],
    tryNext: [],
  });
  render(createElement(MyCarte, { language: "en", initialPrefs: EMPTY_PREFS }));
  const t = MY_CARTE_STRINGS.en;
  fireEvent.click(screen.getByRole("tab", { name: t.tabTaste }));
  fireEvent.click(screen.getByRole("button", { name: t.tasteButton }));
  await screen.findByText("Personal taste summary");
  fireEvent.click(screen.getByRole("button", { name: t.share }));
  await screen.findByText(t.shareFailed);
  expect(screen.queryByRole("button", { name: t.copied })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: t.clearAll }));
  expect(screen.queryByText("Personal taste summary")).toBeNull();
});
