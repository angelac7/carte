import { describe, expect, it } from "vitest";
import {
  distanceMeters,
  isValidPlaceId,
  normalizeElement,
  parseOpeningHours,
  safeUrl,
} from "@/lib/places/normalize";

describe("normalizeElement", () => {
  it("builds a place from OpenStreetMap tags and drops unnamed places", () => {
    const place = normalizeElement({
      type: "way",
      id: 42,
      center: { lat: 42.44, lon: -76.5 },
      tags: {
        name: "Joe's Ramen",
        amenity: "restaurant",
        cuisine: "korean;ramen_noodles",
        "addr:housenumber": "12",
        "addr:street": "State Street",
        "diet:vegan": "yes",
        website: "javascript:alert(1)",
      },
    });
    expect(place).toMatchObject({
      id: "way-42",
      cuisine: ["Korean", "Ramen noodles"],
      address: "12 State Street",
      diets: ["vegan"],
      website: "",
    });
    expect(normalizeElement({ type: "node", id: 1, lat: 0, lon: 0, tags: {} })).toBeNull();
  });
});

describe("safeUrl and place ids", () => {
  it("allows only web links and well-formed ids", () => {
    expect(safeUrl("https://joes.example")).toBe("https://joes.example/");
    expect(safeUrl("ftp://joes.example")).toBe("");
    expect(isValidPlaceId("node-123")).toBe(true);
    expect(isValidPlaceId("node-abc")).toBe(false);
  });
});

describe("parseOpeningHours", () => {
  it("reads day ranges, lists, and closed days", () => {
    const hours = parseOpeningHours("Mo-Fr 11:00-22:00; Sa,Su 12:00-23:00; Mo off");
    expect(hours?.tue).toEqual({ open: "11:00", close: "22:00" });
    expect(hours?.sun).toEqual({ open: "12:00", close: "23:00" });
    expect(hours?.mon).toBeNull();
  });

  it("treats 24/7 as always open", () => {
    expect(parseOpeningHours("24/7")?.wed).toEqual({ open: "00:00", close: "00:00" });
  });

  it("refuses complex hours rather than guessing", () => {
    expect(parseOpeningHours("Mo-Fr 11:00-14:00,17:00-22:00")).toBeNull();
    expect(parseOpeningHours("PH off")).toBeNull();
  });
});

describe("distanceMeters", () => {
  it("measures about 111 km per degree of latitude", () => {
    const meters = distanceMeters({ lat: 42, lon: -76 }, { lat: 43, lon: -76 });
    expect(Math.round(meters / 1000)).toBe(111);
  });
});

it("rejects non-food map listings and invalid coordinates", () => {
  const element = {
    type: "node",
    id: 123,
    lat: 42,
    lon: -76,
    tags: { name: "Named place", amenity: "school" },
  };
  expect(normalizeElement(element)).toBeNull();
  expect(
    normalizeElement({ ...element, lat: Infinity, tags: { ...element.tags, amenity: "cafe" } }),
  ).toBeNull();
  expect(normalizeElement({ ...element, tags: { ...element.tags, amenity: "cafe" } })?.id).toBe(
    "node-123",
  );
});
