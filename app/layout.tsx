import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Brand wordmark font (EthValue lockup: "Eth" 600 / "Value" 300).
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "EthValue — What is ETH actually worth right now?",
  description:
    "Real-time Ethereum price tracker with 10-year candlestick history, portfolio manager in USD & EUR, and deep metrics beyond spot price.",
  keywords: ["ethereum", "ETH", "price", "portfolio", "crypto", "candlestick"],
  icons: {
    icon: [
      { url: "/brand/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/favicon/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/brand/favicon/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/brand/favicon/site.webmanifest",
  openGraph: {
    title: "EthValue — Beyond ETH Spot Price",
    description: "Track your ETH portfolio in real-time. USD & EUR values, 10-year chart, staking metrics.",
    type: "website",
    images: [{ url: "/brand/avatar/og-image-1200x630.png", width: 1200, height: 630, alt: "EthValue" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EthValue — Beyond ETH Spot Price",
    description: "Track your ETH portfolio in real-time. USD & EUR values, 10-year chart, staking metrics.",
    images: ["/brand/avatar/og-image-1200x630.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#070709",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${sora.variable} font-sans bg-black text-white min-h-screen antialiased`}>
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
