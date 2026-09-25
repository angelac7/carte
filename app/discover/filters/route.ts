import { NextResponse, type NextRequest } from "next/server";
import { isAllergen, isDietaryTag } from "@/lib/allergens";
import { parsePrefs, PREFS_COOKIE, serializePrefs } from "@/lib/diner-prefs";

/** Persist the filters before navigating, including with JavaScript disabled. */
export function GET(request: NextRequest) {
  const url = new URL(request.url);
  // Discover only sets allergies and diets; the trace setting made on a menu is kept.
  const prefs = {
    ...parsePrefs(request.cookies.get(PREFS_COOKIE)?.value),
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
