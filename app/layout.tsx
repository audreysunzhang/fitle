import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const serif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Cop or Drop",
  description: "A daily game about fashion prices and taste.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f1" },
    { media: "(prefers-color-scheme: dark)", color: "#141110" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        {children}
        <footer className="site-footer">
          <p>
            Cop or Drop is an independent game. Not affiliated with, endorsed by, or sponsored by
            any brand shown. Brand names identify products only.
          </p>
          <p>
            <Link href="/privacy">Privacy</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
