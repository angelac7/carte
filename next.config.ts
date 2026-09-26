import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera, microphone, and location are only for Carte's own photo, voice, and nearby features.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Only dish photos from our own Supabase project may be shown through Next's image optimizer.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/dish-photos/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      // Nothing may show Carte inside a frame, except the menus made for restaurants' websites.
      {
        source: "/((?!embed/).*)",
        headers: [...securityHeaders, { key: "X-Frame-Options", value: "DENY" }],
      },
      {
        source: "/embed/:slug",
        headers: [
          ...securityHeaders,
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
