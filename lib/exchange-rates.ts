import { parseEcbRates, type ExchangeRates } from "@/lib/prices";

const ECB_DAILY = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

/**
 * Today's reference rates from the European Central Bank, kept for 12 hours so menus don't wait
 * on it. Null when they can't be fetched; menus then just show their own prices.
 */
export async function getExchangeRates(): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(ECB_DAILY, {
      next: { revalidate: 12 * 60 * 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    return parseEcbRates(await response.text());
  } catch {
    return null;
  }
}
