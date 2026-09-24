import { describe, expect, it } from "vitest";
import { splitBill } from "@/lib/bill";

describe("splitBill", () => {
  it("gives assigned dishes to one person and splits shared dishes evenly", () => {
    const bill = splitBill(
      [
        { price: 20, quantity: 1, person: "Ana" },
        { price: 10, quantity: 2, person: null },
      ],
      ["Ana", "Ben"],
      0,
      0,
    );
    expect(bill.perPerson).toEqual({ Ana: 30, Ben: 10 });
    expect(bill.total).toBe(40);
  });

  it("adds tax and tip in proportion to what each person ordered", () => {
    const bill = splitBill([{ price: 100, quantity: 1, person: "Ana" }], ["Ana"], 0.08, 0.2);
    expect(bill.tax).toBe(8);
    expect(bill.tip).toBe(20);
    expect(bill.perPerson.Ana).toBe(128);
  });

  it("counts unpriced dishes and still totals the rest when nobody is added", () => {
    const bill = splitBill(
      [
        { price: null, quantity: 1, person: null },
        { price: 15, quantity: 1, person: null },
      ],
      [],
      0,
      0,
    );
    expect(bill.unpricedCount).toBe(1);
    expect(bill.subtotal).toBe(15);
    expect(bill.perPerson).toEqual({});
  });
});
