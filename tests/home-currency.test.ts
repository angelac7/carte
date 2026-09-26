import { describe, expect, it } from "vitest";
import { parseDisplay, serializeDisplay } from "@/lib/display-prefs";
import { HELP_STRINGS } from "@/lib/i18n/help-strings";
import { LANGUAGES } from "@/lib/languages";
import {
  approximatePrice,
  convertAmount,
  formatApproximate,
  guessCurrency,
  isConvertible,
  parseEcbRates,
} from "@/lib/prices";
import { ProfileSchema, normalizeProfile } from "@/lib/restaurant-profile";
import { menuStructuredData } from "@/lib/structured-data";

const XML = `<?xml version="1.0"?><gesmes:Envelope><Cube><Cube time='2026-09-25'>
  <Cube currency='USD' rate='1.1403'/><Cube currency='JPY' rate='179.70'/><Cube currency='GBP' rate='0.86045'/>
  <Cube currency='KRW' rate='1545.16'/><Cube currency='CAD' rate='1.6127'/><Cube currency='MXN' rate='20.1816'/>
  <Cube currency='INR' rate='109.2605'/><Cube currency='PHP' rate='71.244'/><Cube currency='THB' rate='38.023'/>
  <Cube currency='CNY' rate='7.6551'/><Cube currency='BRL' rate='5.9091'/></Cube></Cube></gesmes:Envelope>`;
const rates = parseEcbRates(XML)!;

describe("prices in the diner's currency", () => {
  it("reads the European Central Bank's daily rates", () => {
    expect(rates.date).toBe("2026-09-25");
    expect(rates.perEuro).toMatchObject({ EUR: 1, USD: 1.1403, JPY: 179.7 });
    expect(parseEcbRates("<html>error</html>")).toBeNull();
  });

  it("works out a menu's currency from its symbols and time zone", () => {
    expect(guessCurrency(["$12", "$8"], "America/New_York")).toBe("USD");
    expect(guessCurrency(["$12"], "America/Toronto")).toBe("CAD");
    expect(guessCurrency(["R$ 30"], "America/New_York")).toBe("BRL");
    expect(guessCurrency(["¥800"], "Asia/Shanghai")).toBe("CNY");
    expect(guessCurrency(["¥800"], "Asia/Tokyo")).toBe("JPY");
    expect(guessCurrency(["12,50 €"])).toBe("EUR");
    expect(guessCurrency(["12"], "Europe/London")).toBe("GBP");
    expect(guessCurrency(["45.000₫"])).toBe("VND");
    expect(isConvertible("VND")).toBe(false);
  });

  it("converts through the euro and shows the result as approximate", () => {
    expect(convertAmount(10, "USD", "JPY", rates)).toBeCloseTo((10 / 1.1403) * 179.7, 6);
    expect(convertAmount(10, "USD", "VND", rates)).toBeNull();
    expect(formatApproximate(1575.9, "JPY", "ja-JP")).toBe("≈ ￥1,576");
    expect(formatApproximate(12.345, "EUR", "en-US")).toBe("≈ €12.35");
    expect(formatApproximate(250.4, "USD", "en-US")).toBe("≈ $250");
  });

  it("only converts when there's something to convert", () => {
    expect(approximatePrice(10, "USD", "USD", rates, "en-US")).toBeNull();
    expect(approximatePrice(null, "USD", "JPY", rates, "en-US")).toBeNull();
    expect(approximatePrice(10, "USD", undefined, rates, "en-US")).toBeNull();
    expect(approximatePrice(10, "USD", "JPY", null, "en-US")).toBeNull();
    expect(approximatePrice(10, "USD", "KRW", rates, "ko-KR")).toMatch(/^≈ ₩13,5\d\d$/);
  });

  it("remembers the diner's choice with their other display settings", () => {
    const saved = serializeDisplay({ largeText: true, highContrast: false, currency: "JPY" });
    expect(saved).toBe("large.cur-JPY");
    expect(parseDisplay(saved)).toEqual({ largeText: true, highContrast: false, currency: "JPY" });
    expect(parseDisplay("cur-jpy.contrast")).toEqual({ largeText: false, highContrast: true });
  });

  it("lets owners set the menu's currency, or leave it to be worked out", () => {
    const base = normalizeProfile({});
    expect(base.currency).toBe("");
    expect(ProfileSchema.safeParse({ ...base, currency: "CAD" }).success).toBe(true);
    expect(ProfileSchema.safeParse({ ...base, currency: "dollars" }).success).toBe(false);
  });

  it("tells search engines each dish's price in the menu's currency", () => {
    const data = menuStructuredData({
      name: "T",
      url: "u",
      currency: "USD",
      dishes: [
        { name: "Pho", description: "", section: "", price: "$14" },
        { name: "Market fish", description: "", section: "", price: "Market price" },
      ],
    });
    const [pho, fish] = data.hasMenu.hasMenuSection[0].hasMenuItem;
    expect(pho).toMatchObject({
      offers: { "@type": "Offer", price: "14.00", priceCurrency: "USD" },
    });
    expect(fish).not.toHaveProperty("offers");
  });

  it("has the words for it in every language", () => {
    for (const { code } of LANGUAGES) {
      expect(HELP_STRINGS[code].showPricesIn).toBeTruthy();
      expect(HELP_STRINGS[code].dontConvert).toBeTruthy();
      expect(HELP_STRINGS[code].ratesNote("25 Sep 2026")).toContain("25 Sep 2026");
    }
  });
});
