import type { Metadata } from "next";
import { Libre_Caslon_Text, Public_Sans } from "next/font/google";
import Link from "next/link";
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
  description: "Turn your menu into a confirmed allergen guide.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caslon.variable} ${publicSans.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="border-b border-line bg-card">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
            <Link href="/" className="font-serif text-2xl">
              Carte
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="text-muted hover:text-ink">
                Upload menu
              </Link>
              <Link href="/review" className="text-muted hover:text-ink">
                Review dishes
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}