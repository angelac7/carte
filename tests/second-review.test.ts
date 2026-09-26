import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const remove = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ storage: { from: () => ({ remove }) } }),
}));
vi.mock("@/lib/supabase/config", () => ({ supabaseUrl: () => "https://test.supabase.co" }));
vi.mock("@/lib/ai/client", () => ({
  streamText: async function* () {
    yield JSON.stringify({
      menuLanguage: "en",
      dishes: Array.from({ length: 61 }, (_, i) => ({
        original: `Dish ${i}`,
        name: `Dish ${i}`,
        description: "Dish",
        allergens: [],
      })),
    });
  },
}));
import { deleteStoredPhoto } from "@/lib/storage/dish-photos";
import { streamPaperMenu } from "@/lib/ai/scan-menu";
import { prepareChatHistory } from "@/lib/chat-history";
import { ChatRequestSchema } from "@/types/chat";
import { splitBill } from "@/lib/bill";
import { GET } from "@/app/discover/filters/route";
import { EMPTY_PREFS, parsePrefs, PREFS_COOKIE, serializePrefs } from "@/lib/diner-prefs";
import { NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-redirect";
it("refuses foreign photo deletion, including another tenant and encoded paths", async () => {
  for (const url of [
    "https://test.supabase.co/storage/v1/object/public/dish-photos/other/dish-1.jpg",
    "https://evil.test/storage/v1/object/public/dish-photos/mine/dish-1.jpg",
    "https://test.supabase.co/storage/v1/object/public/dish-photos/mine/%2e%2e%2fother.jpg",
  ])
    await deleteStoredPhoto(url, "mine");
  expect(remove).not.toHaveBeenCalled();
  await deleteStoredPhoto(
    "https://test.supabase.co/storage/v1/object/public/dish-photos/mine/dish-1.jpg",
    "mine",
  );
  expect(remove).toHaveBeenCalledWith(["mine/dish-1.jpg"]);
});
it("marks capped scans as partial", async () => {
  const updates = [];
  for await (const update of streamPaperMenu("image", "image/jpeg", "English"))
    updates.push(update);
  expect(updates.filter((update) => "dish" in update)).toHaveLength(60);
  expect(updates.at(-1)).toEqual({ partial: true });
});
it("accepts followups after long answers without changing the displayed answer", () => {
  const answer = { role: "assistant" as const, content: "a".repeat(5000) };
  const messages = prepareChatHistory([answer, { role: "user", content: "What else?" }]);
  expect(ChatRequestSchema.safeParse({ language: "en", messages }).success).toBe(true);
  expect(answer.content).toHaveLength(5000);
});
it("allocates every cent and makes tax, tip and total agree", () => {
  for (const price of [10, 0.05, 1.01, 19.99]) {
    const bill = splitBill([{ price, quantity: 1, person: null }], ["A", "B", "C"], 0.075, 0.18);
    expect(Object.values(bill.perPerson).reduce((sum, n) => sum + Math.round(n * 100), 0)).toBe(
      Math.round(bill.total * 100),
    );
    expect(Math.round((bill.subtotal + bill.tax + bill.tip) * 100)).toBe(
      Math.round(bill.total * 100),
    );
  }
  expect(
    splitBill([{ price: 10, quantity: 1, person: null }], ["A", "B", "C"], 0, 0).perPerson,
  ).toEqual({ A: 3.34, B: 3.33, C: 3.33 });
});
it("persists validated Discover filters before opening results", () => {
  // A trace setting chosen on a menu survives choosing filters on Discover.
  const response = GET(
    new NextRequest(
      "https://carte.test/discover/filters?avoid=milk&avoid=invalid&tag=vegan&q=salad",
      {
        headers: {
          cookie: `${PREFS_COOKIE}=${serializePrefs({ ...EMPTY_PREFS, hideTraces: true })}`,
        },
      },
    ),
  );
  expect(parsePrefs(response.cookies.get(PREFS_COOKIE)?.value)).toEqual({
    avoid: ["milk"],
    onlyTags: ["vegan"],
    alsoAvoid: [],
    hideTraces: true,
    severity: "allergy",
  });
  expect(response.headers.get("location")).toContain("/discover?");
});
it("preserves claim destinations but rejects external and malformed redirects", () => {
  expect(safeNextPath("/dashboard/claim?place=node%2F123")).toBe(
    "/dashboard/claim?place=node%2F123",
  );
  for (const value of ["//evil.test", "/\\evil.test", "/\nevil.test", ["/dashboard"]])
    expect(safeNextPath(value)).toBe("/dashboard");
});
