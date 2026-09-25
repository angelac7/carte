// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { AllergyStatement } from "@/components/AllergyCard";
import { EMPTY_PREFS, parsePrefs, serializePrefs } from "@/lib/diner-prefs";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { LANGUAGES } from "@/lib/languages";

describe("allergy severity", () => {
  it("is remembered with the diner's other settings, defaulting to an allergy", () => {
    expect(parsePrefs(undefined).severity).toBe("allergy");
    const saved = serializePrefs({ ...EMPTY_PREFS, avoid: ["peanuts"], severity: "severe" });
    expect(parsePrefs(saved).severity).toBe("severe");
    expect(parsePrefs(serializePrefs({ ...EMPTY_PREFS, severity: "mild" as never })).severity).toBe(
      "allergy",
    );
  });

  it("has fixed staff wording in every language", () => {
    for (const { code } of LANGUAGES) {
      const t = TABLE_STRINGS[code];
      expect(t.severeNote && t.statementIntolerance && t.severities.severe).toBeTruthy();
    }
  });

  it("tells staff when an allergy is severe, and calls an intolerance an intolerance", () => {
    const { rerender } = render(
      createElement(AllergyStatement, { language: "en", avoid: ["peanuts"], severity: "severe" }),
    );
    expect(screen.getByText(TABLE_STRINGS.en.severeNote)).toBeTruthy();
    rerender(
      createElement(AllergyStatement, { language: "en", avoid: ["milk"], severity: "intolerance" }),
    );
    expect(screen.getByText(TABLE_STRINGS.en.statementIntolerance)).toBeTruthy();
    expect(screen.queryByText(TABLE_STRINGS.en.severeNote)).toBeNull();
  });
});
