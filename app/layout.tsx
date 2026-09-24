import type { Metadata } from "next";
import { Libre_Caslon_Text, Public_Sans } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Toasts } from "@/components/Toasts";
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
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${caslon.variable} ${publicSans.variable}`}
    >
      <body className="min-h-screen antialiased">
        <MotionProvider>{children}</MotionProvider>
        <Toasts />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
