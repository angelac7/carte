/** The public address of the site, for links that leave it, like sitemaps and shared previews. */
export function siteUrl(): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url =
    process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
