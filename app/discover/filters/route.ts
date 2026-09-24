import { NextResponse } from "next/server";
import { isAllergen, isDietaryTag } from "@/lib/allergens";
import { PREFS_COOKIE, serializePrefs } from "@/lib/diner-prefs";

/** Persist the filters before navigating, including with JavaScript disabled. */
export function GET(request: Request) {
  const url = new URL(request.url);
  const prefs = {
    avoid: url.searchParams.getAll("avoid").filter(isAllergen),
    onlyTags: url.searchParams.getAll("tag").filter(isDietaryTag),
  };
  url.pathname = "/discover";
  const response = NextResponse.redirect(url);
  response.cookies.set(PREFS_COOKIE, serializePrefs(prefs), {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
  return response;
}
