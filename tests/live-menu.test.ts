// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/components/DinerMenu", () => ({
  DinerMenu: ({ dishes }: { dishes: { name: string }[] }) =>
    createElement("div", null, dishes.map((dish) => dish.name).join(",")),
}));
import { LiveDinerMenu } from "@/components/LiveDinerMenu";
import { DEFAULT_DISPLAY } from "@/lib/display-prefs";
const dish = {
  id: "dish",
  name: "Soup",
  description: "",
  price: "",
  notes: "",
  allergens: [],
  dietary_tags: [],
  confirmed: true,
  revision: 1,
};
const props = {
  restaurant: { name: "Cafe", slug: "cafe", cuisine: "" },
  dishes: [dish],
  initialLanguage: "en" as const,
  initialPrefs: { avoid: [], onlyTags: [], hideTraces: false },
  initialDisplay: DEFAULT_DISPLAY,
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("removes withdrawn dishes on refresh and explains the reset", async () => {
  vi.useFakeTimers();
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: async () => ({ dishes: [] }) });
  vi.stubGlobal("fetch", fetch);
  render(createElement(LiveDinerMenu, props));
  expect(screen.getByText("Soup")).toBeTruthy();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(screen.queryByText("Soup")).toBeNull();
  expect(screen.getByRole("status").textContent).toContain("updated");
});
it("rejects unconfirmed responses and surfaces refresh failures", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ dishes: [{ ...dish, name: "Unconfirmed", confirmed: false }] }),
    }),
  );
  render(createElement(LiveDinerMenu, props));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(screen.queryByText("Unconfirmed")).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("staff");
});
it("does not reset an unchanged menu just because JSON field order differs", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ dishes: [Object.fromEntries(Object.entries(dish).reverse())] }),
    }),
  );
  render(createElement(LiveDinerMenu, props));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByText("Soup")).toBeTruthy();
});
