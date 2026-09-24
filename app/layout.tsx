import type { Metadata } from "next";
import { Libre_Caslon_Text, Public_Sans } from "next/font/google";
import "./globals.css";

const caslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caslon",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "Carte",
  description: "Menus with confirmed allergens, translations, and answers for every diner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caslon.variable} ${publicSans.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
