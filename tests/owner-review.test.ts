// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MenuItem } from "@/types/menu";

vi.mock("@/lib/api-client", () => ({
  fetchDishes: vi.fn(),
  updateDish: vi.fn(),
  saveDishes: vi.fn(),
  deleteDish: vi.fn(),
  deleteAllDishes: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("@/components/owner/DishPhotoEditor", () => ({ DishPhotoEditor: () => null }));
import ReviewDishes from "@/components/owner/ReviewDishes";
import { fetchDishes, updateDish } from "@/lib/api-client";
import { toast } from "sonner";

const dish: MenuItem = {
  id: "dish",
  name: "Soup",
  description: "",
  price: "$12",
  allergens: [],
  dietary_tags: [],
  notes: "",
  confirmed: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.mocked(fetchDishes).mockResolvedValue([dish]);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("locks edits until the save completes and only announces persisted confirmation", async () => {
  let finish!: (value: MenuItem) => void;
  vi.mocked(updateDish).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(createElement(ReviewDishes));
  const milk = await screen.findByRole("button", { name: "milk" });
  fireEvent.click(milk);
  expect(updateDish).toHaveBeenCalledTimes(1);
  expect(milk.closest("fieldset[disabled]")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "eggs" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm dish" }));
  expect(updateDish).toHaveBeenCalledTimes(1);
  expect(toast).not.toHaveBeenCalled();
  await act(async () => {
    finish({ ...dish, allergens: ["milk"] });
  });
  expect(milk.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Confirm dish" }));
  expect(toast).not.toHaveBeenCalled();
  await act(async () => {
    finish({ ...dish, allergens: ["milk"], confirmed: true });
  });
  expect(toast).toHaveBeenCalledWith("✓ Soup confirmed");
});

it("restores saved notes when a save fails", async () => {
  vi.mocked(updateDish).mockRejectedValue(new Error("offline"));
  render(createElement(ReviewDishes));
  const notes = await screen.findByRole("textbox", { name: "Kitchen notes" });
  fireEvent.change(notes, { target: { value: "Unsaved notes" } });
  fireEvent.blur(notes);
  await waitFor(() => expect((notes as HTMLTextAreaElement).value).toBe(""));
  expect(screen.getByRole("alert").textContent).toContain("restored");
});
