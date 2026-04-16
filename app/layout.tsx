import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EthValue — What is ETH actually worth right now?",
  description:
    "Real-time Ethereum price tracker with 10-year candlestick history, portfolio manager in USD & EUR, and deep metrics beyond spot price.",
  keywords: ["ethereum", "ETH", "price", "portfolio", "crypto", "candlestick"],
  openGraph: {
    title: "EthValue — Beyond ETH Spot Price",
    description: "Track your ETH portfolio in real-time. USD & EUR values, 10-year chart, staking metrics.",
    type: "website",
  },
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-black text-white min-h-screen antialiased`}>
        {/* Subtle dot grid */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Vignette */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        <div className="relative z-10">
          <Navigation />
          <main>{children}</main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
