/** Reads a menu price like "$12.50", "57", "1,200", or "12,50 €". Returns null if there's no clear number. */
export function parsePrice(text: string): number | null {
  // A single amount only: ranges, size choices, and quantities need staff clarification.
  const numbers = text.match(/\d[\d.,]*(?:[ \u00a0\u202f]\d[\d.,]*)*/g);
  if (!numbers || numbers.length !== 1 || /[-–—/]/.test(text)) return null;
  const raw = numbers[0];
  const grouped = /^\d{1,3}([., \u00a0\u202f])\d{3}(?:\1\d{3})*(?:([.,])\d{1,2})?$/;
  const match = raw.match(grouped);
  let normalized: string;
  if (match && match[1] !== match[2]) {
    normalized = raw.split(match[1]).join("").replace(",", ".");
  } else if (/^\d+(?:[.,]\d{1,2})?$/.test(raw)) {
    normalized = raw.replace(",", ".");
  } else {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const CURRENCY_SYMBOLS = ["$", "€", "£", "¥", "₩", "₫"];

/** Uses the first currency symbol found on the menu, or "$" if prices have none. */
export function detectCurrency(prices: string[]): string {
  for (const price of prices) {
    for (const symbol of CURRENCY_SYMBOLS) if (price.includes(symbol)) return symbol;
  }
  return "$";
}

export function formatMoney(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

/** A round amount without cents, like "$15" or "¥1,500"; other amounts keep their cents. */
export function formatWhole(amount: number, symbol: string): string {
  return Number.isInteger(amount)
    ? `${symbol}${amount.toLocaleString("en-US")}`
    : formatMoney(amount, symbol);
}
