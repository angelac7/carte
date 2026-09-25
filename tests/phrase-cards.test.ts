// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PhraseCards } from "@/components/PhraseCards";
import { PHRASE_IDS, PHRASE_STRINGS } from "@/lib/i18n/phrase-strings";
import { LANGUAGES } from "@/lib/languages";

afterEach(cleanup);

describe("phrase cards", () => {
  it("has every phrase in every language", () => {
    for (const { code } of LANGUAGES) {
      for (const id of PHRASE_IDS) expect(PHRASE_STRINGS[code].phrases[id]).toBeTruthy();
    }
  });

  it("shows a phrase large in the staff's language, with the diner's underneath", () => {
    render(createElement(PhraseCards, { language: "es", staffLanguage: "ko" }));
    fireEvent.click(screen.getByText(PHRASE_STRINGS.es.phrases.sameOil));
    const large = screen.getByText(PHRASE_STRINGS.ko.phrases.sameOil);
    expect(large.getAttribute("lang")).toBe("ko");
    expect(screen.getByText(PHRASE_STRINGS.es.phrases.sameOil)).toBeTruthy();
  });
});
