import { describe, expect, it } from "vitest";
import { menuToCsv, parseCsv, planImport, readImport } from "@/lib/menu-csv";
import type { MenuItem } from "@/types/menu";

const dish = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: "3f0c9a4e-2b1d-4c8e-9f6a-7d5b3c2a1e0f",
  revision: 3,
  name: "Peanut Noodles",
  description: 'Chewy noodles, "house" sauce',
  price: "$14",
  allergens: ["peanuts", "wheat"],
  dietary_tags: ["vegetarian"],
  notes: "Shared wok,\nask about sesame",
  confirmed: true,
  section: "Noodles",
  calories: 780,
  spice: 2,
  removable: ["peanuts"],
  may_contain: ["sesame"],
  also_contains: ["garlic"],
  special: false,
  ...overrides,
});

describe("menu spreadsheet", () => {
  it("round-trips: downloading and uploading unchanged changes nothing", () => {
    const menu = [
      dish(),
      dish({ id: "b", name: "Green Salad", allergens: [], removable: [], calories: null }),
    ];
    const { rows, problems } = readImport(menuToCsv(menu));
    expect(problems).toEqual([]);
    expect(planImport(rows, menu)).toEqual({ add: [], change: [], unchanged: 2 });
  });

  it("writes a file Excel reads as UTF-8, and keeps formulas from running", () => {
    const csv = menuToCsv([dish({ name: '=HYPERLINK("http://x")', description: "Café crème" })]);
    expect(csv.startsWith("﻿id,section,name")).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(csv).toContain("Café crème");
    // The apostrophe comes off again on the way back in.
    expect(readImport(csv).rows[0].name).toBe('=HYPERLINK("http://x")');
  });

  it("reads quoted cells with commas, quotes, and line breaks", () => {
    expect(parseCsv('a,"b, c","say ""hi""","two\nlines"\r\n\r\nx,y,,z\n')).toEqual([
      ["a", "b, c", 'say "hi"', "two\nlines"],
      ["x", "y", "", "z"],
    ]);
  });

  it("reports rows it can't understand, by row, and imports nothing from them", () => {
    const csv = [
      "name,allergens,spice,calories",
      "Soup,milk; kiwi,1,200",
      ",wheat,,",
      "Curry,,9,",
      "Tea,,,1,500",
    ].join("\n");
    const { rows, problems } = readImport(csv);
    expect(problems).toEqual([
      { line: 2, message: "Unknown allergen “kiwi”." },
      { line: 3, message: "Every dish needs a name." },
      { line: 4, message: "Spice should be a whole number from 0 to 3." },
    ]);
    expect(rows.map((row) => row.name)).toEqual(["Tea"]);
  });

  it("accepts friendly column names, commas between allergens, and any capitals", () => {
    const { rows, problems } = readImport('Dish,Contains,Diet\nSoup,"Milk, Tree Nuts",VEGAN\n');
    expect(problems).toEqual([]);
    expect(rows[0]).toMatchObject({
      name: "Soup",
      allergens: ["milk", "tree nuts"],
      dietary_tags: ["vegan"],
    });
  });

  it("changes only what the file says, leaving missing columns alone", () => {
    const menu = [dish()];
    const { rows } = readImport(`id,name,price\n${menu[0].id},Peanut Noodles,$15\n`);
    const plan = planImport(rows, menu);
    expect(plan.change).toHaveLength(1);
    expect(plan.change[0].fields).toEqual(["price"]);
    expect(plan.change[0].updated).toMatchObject({
      price: "$15",
      allergens: ["peanuts", "wheat"],
      calories: 780,
      confirmed: false,
    });
  });

  it("adds rows without a known id, and keeps allergen details consistent", () => {
    const menu = [dish()];
    const { rows } = readImport(
      `id,name,allergens,can_leave_out,may_contain\n${menu[0].id},Peanut Noodles,wheat,peanuts,wheat\nnot-an-id,Rice,,,\n`,
    );
    const plan = planImport(rows, menu);
    expect(plan.add.map((row) => row.name)).toEqual(["Rice"]);
    expect(plan.change[0].updated.removable).toEqual([]);
    expect(plan.change[0].updated.may_contain).toEqual([]);
  });

  it("refuses files without a name column or with too many dishes", () => {
    expect(readImport("price\n$4\n").problems[0].message).toMatch(/name/);
    const big = ["name", ...Array.from({ length: 1001 }, (_, i) => `Dish ${i}`)].join("\n");
    expect(readImport(big).problems[0].message).toMatch(/1000/);
  });
});
