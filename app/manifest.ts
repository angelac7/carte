import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carte",
    short_name: "Carte",
    description: "Menus with confirmed allergens, translations, and answers for every diner.",
    start_url: "/my",
    display: "standalone",
    background_color: "#f6f7f4",
    theme_color: "#1c2a39",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
