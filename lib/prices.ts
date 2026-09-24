/** Reads a menu price like "$12.50", "57", "1,200", or "12,50 €". Returns null if there's no clear number. */
export function parsePrice(text: string): number | null {
  const withoutThousands = text.replace(/(\d),(\d{3})\b/g, "$1$2");
  const match = withoutThousands.match(/\d+(?:[.,]\d{1,2})?/);
  if (!match) return null;
  const value = Number(match[0].replace(",", "."));
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
