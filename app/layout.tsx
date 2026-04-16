import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EthValue — What is ETH actually worth right now?",
  description:
    "Real-time Ethereum price tracker with 10-year candlestick history, portfolio manager in USD & EUR, and deep metrics beyond the spot price.",
  keywords: ["ethereum", "ETH", "price", "portfolio", "crypto", "candlestick", "chart"],
  openGraph: {
    title: "EthValue — Beyond ETH Spot Price",
    description: "Track your ETH portfolio in real-time. USD & EUR values, historical charts, staking metrics.",
    type: "website",
  },
  themeColor: "#060610",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} font-sans bg-eth-darker text-white min-h-screen antialiased`}
      >
        {/* Background mesh */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 20% 10%, rgba(98, 126, 234, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(167, 139, 250, 0.05) 0%, transparent 50%)",
          }}
        />

        {/* Grid overlay */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(98,126,234,1) 1px, transparent 1px), linear-gradient(90deg, rgba(98,126,234,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10">
          <Navigation />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
