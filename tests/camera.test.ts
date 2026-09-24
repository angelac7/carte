import { describe, expect, it } from "vitest";
import { readImageUpload } from "@/lib/read-image-upload";
import { PhotoMatchSchema, ScannedMenuSchema } from "@/types/camera";

describe("PhotoMatchSchema", () => {
  it("keeps at most three matches and treats unknown confidence as low", () => {
    const matches = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      confidence: i === 0 ? "certain" : "high",
    }));
    const result = PhotoMatchSchema.parse({ matches });
    expect(result.matches).toHaveLength(3);
    expect(result.matches[0].confidence).toBe("low");
  });
});

describe("ScannedMenuSchema", () => {
  it("drops unknown allergens and empty dishes", () => {
    const menu = ScannedMenuSchema.parse({
      menuLanguage: "ja",
      dishes: [
        { original: "ラーメン", name: "Ramen", allergens: ["wheat", "celery"] },
        { original: "", name: "" },
      ],
    });
    expect(menu.dishes).toHaveLength(1);
    expect(menu.dishes[0].allergens).toEqual(["wheat"]);
  });
});

describe("readImageUpload", () => {
  it("rejects missing files and unsupported types", async () => {
    expect((await readImageUpload(null)).ok).toBe(false);
    const pdf = new File(["x"], "menu.pdf", { type: "application/pdf" });
    expect(await readImageUpload(pdf)).toMatchObject({ ok: false, status: 400 });
    const png = new File(["x"], "menu.png", { type: "image/png" });
    expect(await readImageUpload(png)).toMatchObject({ ok: true, mediaType: "image/png" });
  });
});
