export type BillLine = { price: number | null; quantity: number; person: string | null };

export type BillSplit = {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  perPerson: Record<string, number>;
  unpricedCount: number;
};

const round = (amount: number) => Math.round(amount * 100) / 100;

/**
 * Splits a bill. A dish assigned to a person goes to them; unassigned dishes are shared evenly.
 * Tax and tip are added in proportion to what each person ordered.
 */
export function splitBill(
  lines: BillLine[],
  people: string[],
  taxRate: number,
  tipRate: number,
): BillSplit {
  const owed = new Map(people.map((person) => [person, 0]));
  let subtotal = 0;
  let unpricedCount = 0;

  for (const line of lines) {
    if (line.price === null) {
      unpricedCount += 1;
      continue;
    }
    const amount = line.price * line.quantity;
    subtotal += amount;
    if (line.person && owed.has(line.person)) {
      owed.set(line.person, owed.get(line.person)! + amount);
    } else if (people.length > 0) {
      for (const person of people) owed.set(person, owed.get(person)! + amount / people.length);
    }
  }

  const multiplier = 1 + taxRate + tipRate;
  return {
    subtotal: round(subtotal),
    tax: round(subtotal * taxRate),
    tip: round(subtotal * tipRate),
    total: round(subtotal * multiplier),
    perPerson: Object.fromEntries(
      [...owed].map(([person, amount]) => [person, round(amount * multiplier)]),
    ),
    unpricedCount,
  };
}
