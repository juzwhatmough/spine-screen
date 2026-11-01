import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font (no runtime request to Google Fonts, no
// layout shift) — see web/REDESIGN_SPEC.md section 3. Replaces the old
// Fraunces/Source Serif 4/IBM Plex Mono Google Fonts <link>.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Shelf — Books",
  description: "A personal reading list, organised by genre.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
