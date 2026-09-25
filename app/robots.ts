import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/** Search engines may read public pages, but not owner pages, sign-in flows, or the API. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api/", "/auth/", "/reset-password", "/goodbye"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
