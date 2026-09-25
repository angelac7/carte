import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/client", () => ({
  createMessage: vi.fn(),
  parseJsonReply: (reply: unknown) => reply,
}));
import { createMessage } from "@/lib/ai/client";
import { translateDishes } from "@/lib/ai/translate";
import { optionLabels, sourceHash, translationHash } from "@/lib/source-hash";
import { MenuItemSchema, type MenuItem } from "@/types/menu";

const ramen: MenuItem = {
  id: "ramen",
  name: "Ramen",
  description: "Pork broth",
  price: "$14",
  allergens: ["wheat"],
  dietary_tags: [],
  notes: "",
  confirmed: false,
  sizes: [{ label: "Large", price: "$17" }],
  addons: [{ label: "Add egg", price: "$2", allergens: ["eggs"] }],
};

beforeEach(() => vi.resetAllMocks());

describe("sizes and add-ons", () => {
  it("accepts owner-set add-on allergens only from Carte's list", () => {
    expect(MenuItemSchema.safeParse(ramen).success).toBe(true);
    const bad = { ...ramen, addons: [{ label: "Add nuts", price: "", allergens: ["walnut"] }] };
    expect(MenuItemSchema.safeParse(bad).success).toBe(false);
    const unnamed = { ...ramen, sizes: [{ label: " ", price: "$1" }] };
    expect(MenuItemSchema.safeParse(unnamed).success).toBe(false);
  });

  it("retranslates when option names change, but not for dishes without any", () => {
    expect(optionLabels(ramen)).toEqual(["Large", "Add egg"]);
    expect(translationHash(ramen)).not.toBe(sourceHash(ramen));
    const renamed = { ...ramen, addons: [{ ...ramen.addons![0], label: "Add two eggs" }] };
    expect(translationHash(renamed)).not.toBe(translationHash(ramen));
    const plain = { ...ramen, sizes: [], addons: [] };
    expect(translationHash(plain)).toBe(sourceHash(plain));
  });

  it("translates every option name, and refuses a reply that drops one", async () => {
    const reply = {
      id: "ramen",
      name: "Ramen",
      description: "Caldo de cerdo",
      notes: "",
      section: "",
      options: ["Grande", "Con huevo"],
    };
    vi.mocked(createMessage).mockResolvedValueOnce({ dishes: [reply] } as never);
    expect((await translateDishes([ramen], "Spanish"))[0].options).toEqual(["Grande", "Con huevo"]);
    vi.mocked(createMessage).mockResolvedValueOnce({
      dishes: [{ ...reply, options: ["Grande"] }],
    } as never);
    await expect(translateDishes([ramen], "Spanish")).rejects.toThrow(/incomplete/);
  });
});
