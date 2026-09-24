// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/api-client", () => ({
  streamMenuImage: vi.fn(),
  saveDishes: vi.fn(),
  fetchTranslations: vi.fn(),
  trackDishView: vi.fn(),
}));
vi.mock("@/lib/image", () => ({ MENU_PHOTO_SIDE: 1600, shrinkImage: async (file: File) => file }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock("@/components/Sheet", () => ({
  Sheet: ({ children }: { children: ReactNode }) => createElement("div", null, children),
}));
import UploadMenu from "@/components/owner/UploadMenu";
import { DiaryEditor } from "@/components/DiaryEditor";
import { DinerMenu } from "@/components/DinerMenu";
import { useDinerPrefs } from "@/lib/use-diner-prefs";
import { writePrefsCookie, EMPTY_PREFS } from "@/lib/diner-prefs";
import { DEFAULT_DISPLAY } from "@/lib/display-prefs";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import { saveDishes, streamMenuImage, fetchTranslations } from "@/lib/api-client";
import { toast } from "sonner";
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  writePrefsCookie(EMPTY_PREFS);
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
it("uses current device preferences instead of cached menu HTML", () => {
  writePrefsCookie({ avoid: ["milk"], onlyTags: ["vegan"] });
  const { result } = renderHook(() => useDinerPrefs(EMPTY_PREFS));
  expect(result.current[0]).toEqual({ avoid: ["milk"], onlyTags: ["vegan"] });
  act(() => writePrefsCookie({ avoid: ["eggs"], onlyTags: [] }));
  expect(result.current[0].avoid).toEqual(["eggs"]);
});
it("blocks new menu uploads while the previous menu saves", async () => {
  vi.mocked(streamMenuImage).mockImplementation(async (_file, onDish) => {
    onDish({ name: "Soup", description: "", price: "", likely_allergens: [], dietary_tags: [] });
  });
  let finish!: () => void;
  vi.mocked(saveDishes).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = () => resolve([]);
      }),
  );
  const { container } = render(createElement(UploadMenu));
  const input = container.querySelector("input")!;
  fireEvent.change(input, {
    target: { files: [new File(["a"], "first.jpg", { type: "image/jpeg" })] },
  });
  fireEvent.click(await screen.findByRole("button", { name: "Save to menu" }));
  expect(input.disabled).toBe(true);
  fireEvent.drop(input.closest("label")!, {
    dataTransfer: { files: [new File(["b"], "second.jpg", { type: "image/jpeg" })] },
  });
  expect(streamMenuImage).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  expect(
    screen.getByText("Saved to your menu. Review each dish to confirm its allergens."),
  ).toBeDefined();
});
it("keeps diary edits open and explains a failed device save", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  const close = vi.fn();
  render(
    createElement(DiaryEditor, {
      dish: {
        dishId: "dish",
        name: "Soup",
        restaurantSlug: "cafe",
        restaurantName: "Cafe",
        description: "",
        price: "",
        cuisine: "",
      },
      language: "en",
      onClose: close,
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: MY_CARTE_STRINGS.en.stars(4) }));
  fireEvent.click(screen.getByRole("button", { name: MY_CARTE_STRINGS.en.saveEntry }));
  expect(close).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith(MY_CARTE_STRINGS.en.storageFailed);
});
it("retries translations after a failed request", async () => {
  vi.mocked(fetchTranslations)
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({});
  render(
    createElement(DinerMenu, {
      restaurant: { name: "Cafe", slug: "cafe", cuisine: "" },
      dishes: [
        {
          id: "dish",
          name: "Soup",
          description: "",
          price: "",
          allergens: [],
          dietary_tags: [],
          notes: "",
          confirmed: true,
        },
      ],
      initialLanguage: "es",
      initialPrefs: EMPTY_PREFS,
      initialDisplay: DEFAULT_DISPLAY,
    }),
  );
  fireEvent.click(await screen.findByRole("button", { name: DINER_STRINGS.es.retryTranslation }));
  await waitFor(() => expect(fetchTranslations).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: DINER_STRINGS.es.retryTranslation })).toBeNull(),
  );
});
