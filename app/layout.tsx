import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Toasts } from "@/components/Toasts";
import "./globals.css";

// Editorial serif for headlines, a clean sans for reading, and mono for small labels.
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Carte",
  description: "Menus with confirmed allergens, translations, and answers for every diner.",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${dmSans.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen antialiased">
        <MotionProvider>{children}</MotionProvider>
        <Toasts />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
