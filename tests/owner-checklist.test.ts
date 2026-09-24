import { describe, expect, it } from "vitest";
import { buildChecklist } from "@/lib/owner-checklist";

const fresh = {
  dishCount: 0,
  needReview: 0,
  withPhotos: 0,
  hasProfile: false,
  listed: false,
  claim: { placeId: null, verified: false },
};

describe("buildChecklist", () => {
  it("starts with nothing done, and never counts an empty menu as confirmed", () => {
    expect(buildChecklist(fresh).filter((item) => item.done)).toEqual([]);
  });

  it("marks every step done for a fully set up restaurant", () => {
    const items = buildChecklist({
      dishCount: 10,
      needReview: 0,
      withPhotos: 4,
      hasProfile: true,
      listed: true,
      claim: { placeId: "node-1", verified: true },
    });
    expect(items.every((item) => item.done)).toBe(true);
  });

  it("notes a map claim that's waiting for verification", () => {
    const items = buildChecklist({ ...fresh, claim: { placeId: "node-1", verified: false } });
    expect(items.find((item) => item.id === "map")).toMatchObject({
      done: false,
      note: "Waiting for verification",
    });
  });
});
