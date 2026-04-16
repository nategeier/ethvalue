"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import PriceHero from "@/components/PriceHero";
import BeyondSpotMetrics from "@/components/BeyondSpotMetrics";

const CandlestickChart = dynamic(() => import("@/components/CandlestickChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl border border-eth-border/30 bg-eth-card/40 flex items-center justify-center h-[600px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-t-eth-purple border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Loading chart...</p>
      </div>
    </div>
  ),
});

const PortfolioManager = dynamic(() => import("@/components/PortfolioManager"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero grid: price + portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriceHero />
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={null}>
            <PortfolioManager />
          </Suspense>
        </div>
      </div>

      {/* 10-year candlestick chart */}
      <Suspense fallback={null}>
        <CandlestickChart />
      </Suspense>

      {/* Beyond spot metrics */}
      <section>
        <BeyondSpotMetrics />
      </section>

      {/* Footer */}
      <footer className="border-t border-eth-border/20 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-eth-purple/50" />
          <span>EthValue — What is ETH actually worth right now?</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Data: Coinbase Exchange API</span>
          <span>•</span>
          <span>Prices update every 30s</span>
          <span>•</span>
          <span>Not financial advice</span>
        </div>
      </footer>
    </div>
  );
}
