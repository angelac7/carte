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

/** A dish's calories as a whole number in the diner's language, like "1,250". */
export function formatCalories(calories: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(calories);
}

// Converting prices into a diner's home currency.

/**
 * Currencies Carte can convert between: the euro and every currency the European Central Bank
 * publishes a daily reference rate for. Others, like the Vietnamese dong, aren't offered.
 */
export const CONVERTIBLE_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "KRW",
  "INR",
  "PHP",
  "THB",
  "MXN",
  "BRL",
  "CAD",
  "AUD",
  "NZD",
  "SGD",
  "HKD",
  "MYR",
  "IDR",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "ISK",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "TRY",
  "ILS",
  "ZAR",
] as const;

export function isCurrencyCode(value: string | null | undefined): value is string {
  return !!value && /^[A-Z]{3}$/.test(value);
}

export function isConvertible(code: string | null | undefined): code is string {
  return !!code && (CONVERTIBLE_CURRENCIES as readonly string[]).includes(code);
}

/** How many of each currency one euro buys, and the day the rates are from. */
export type ExchangeRates = { date: string; perEuro: Record<string, number> };

/** Reads the European Central Bank's daily reference rates. Returns null if they look wrong. */
export function parseEcbRates(xml: string): ExchangeRates | null {
  const date = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  if (!date) return null;
  const perEuro: Record<string, number> = { EUR: 1 };
  for (const [, code, rate] of xml.matchAll(
    /currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g,
  )) {
    const value = Number(rate);
    if (Number.isFinite(value) && value > 0) perEuro[code] = value;
  }
  return Object.keys(perEuro).length > 10 ? { date, perEuro } : null;
}

// Symbols in the order to look for them: "R$" before "$".
const SYMBOLS: [string, string | ((timezone: string) => string)][] = [
  ["R$", "BRL"],
  ["€", "EUR"],
  ["£", "GBP"],
  ["₩", "KRW"],
  ["₫", "VND"],
  ["฿", "THB"],
  ["₹", "INR"],
  ["₱", "PHP"],
  ["¥", (tz) => (tz === "Asia/Shanghai" ? "CNY" : "JPY")],
  ["$", (tz) => DOLLARS[tz] ?? "USD"],
];

const DOLLARS: Record<string, string> = {
  "America/Toronto": "CAD",
  "America/Vancouver": "CAD",
  "America/Mexico_City": "MXN",
  "Australia/Sydney": "AUD",
  "Asia/Singapore": "SGD",
  "Asia/Hong_Kong": "HKD",
};

const BY_TIMEZONE: Record<string, string> = {
  ...DOLLARS,
  "Europe/London": "GBP",
  "Europe/Paris": "EUR",
  "Europe/Berlin": "EUR",
  "Asia/Seoul": "KRW",
  "Asia/Tokyo": "JPY",
  "Asia/Shanghai": "CNY",
  "Asia/Ho_Chi_Minh": "VND",
};

/**
 * A menu's currency from the symbols on its prices and the restaurant's time zone: "$" in
 * Toronto is Canadian dollars. Owners can set it instead when this guesses wrong.
 */
export function guessCurrency(prices: readonly string[], timezone = "America/New_York"): string {
  for (const [symbol, code] of SYMBOLS) {
    if (prices.some((price) => price.includes(symbol))) {
      return typeof code === "string" ? code : code(timezone);
    }
  }
  return BY_TIMEZONE[timezone] ?? "USD";
}

/** An amount in another currency, or null when either currency has no rate. */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRates,
): number | null {
  const fromRate = rates.perEuro[from];
  const toRate = rates.perEuro[to];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}

/** An approximate amount, like "≈ ¥2,140" or "≈ €12.50": whole units once it's 100 or more. */
export function formatApproximate(amount: number, currency: string, locale: string): string {
  const whole = amount >= 100;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).format(amount);
  return `≈ ${formatted}`;
}

/** A price in the diner's currency, like "≈ ¥2,140", or null when it can't or needn't convert. */
export function approximatePrice(
  amount: number | null,
  from: string | null | undefined,
  to: string | null | undefined,
  rates: ExchangeRates | null | undefined,
  locale: string,
): string | null {
  if (amount === null || !from || !to || from === to || !rates) return null;
  const converted = convertAmount(amount, from, to, rates);
  return converted === null ? null : formatApproximate(converted, to, locale);
}
