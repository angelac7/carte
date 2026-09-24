export type BillLine = { price: number | null; quantity: number; person: string | null };

export type BillSplit = {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  perPerson: Record<string, number>;
  unpricedCount: number;
};

/** Split integer cents, assigning leftover cents by largest remainder. */
export function splitBill(
  lines: BillLine[],
  people: string[],
  taxRate: number,
  tipRate: number,
): BillSplit {
  const names = [...new Set(people)];
  const owed = new Map(names.map((name) => [name, 0]));
  let subtotalCents = 0;
  let unpricedCount = 0;
  for (const line of lines) {
    if (line.price === null) {
      unpricedCount++;
      continue;
    }
    const cents = Math.round(line.price * 100) * line.quantity;
    subtotalCents += cents;
    if (line.person && owed.has(line.person)) owed.set(line.person, owed.get(line.person)! + cents);
    else for (const name of names) owed.set(name, owed.get(name)! + cents / names.length);
  }
  const taxCents = Math.round(subtotalCents * taxRate);
  const tipCents = Math.round(subtotalCents * tipRate);
  const totalCents = subtotalCents + taxCents + tipCents;
  const shares = names.map((name) => {
    const exact = subtotalCents ? (owed.get(name)! / subtotalCents) * totalCents : 0;
    const cents = Math.floor(exact);
    return { name, cents, remainder: exact - cents };
  });
  let remaining = totalCents - shares.reduce((sum, share) => sum + share.cents, 0);
  for (const share of [...shares].sort((a, b) => b.remainder - a.remainder)) {
    if (remaining-- > 0) share.cents++;
  }
  return {
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    tip: tipCents / 100,
    total: totalCents / 100,
    perPerson: Object.fromEntries(shares.map(({ name, cents }) => [name, cents / 100])),
    unpricedCount,
  };
}
