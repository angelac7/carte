import { describe, expect, it } from "vitest";
import { isInviteCode, newInviteCode } from "@/lib/db/team";

describe("invite links", () => {
  it("uses long, unambiguous codes that the database accepts", () => {
    const codes = new Set(Array.from({ length: 200 }, newInviteCode));
    expect(codes.size).toBe(200);
    for (const code of codes) {
      expect(isInviteCode(code)).toBe(true);
      expect(code).not.toMatch(/[01lo]/);
    }
    expect(isInviteCode("../dashboard")).toBe(false);
    expect(isInviteCode("ABCDEFGHJKMN")).toBe(false);
  });
});
