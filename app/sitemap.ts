import type { MetadataRoute } from "next";
import { listListedMenuSlugs } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PUBLIC_PAGES = ["", "/discover", "/places", "/scan", "/signup", "/privacy", "/terms"];

/** Public pages, plus every menu its owner chose to show on Discover. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const slugs = await listListedMenuSlugs(await createClient()).catch(() => [] as string[]);
  return [
    ...PUBLIC_PAGES.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const })),
    ...slugs.map((slug) => ({ url: `${base}/r/${slug}`, changeFrequency: "daily" as const })),
  ];
}
