"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEthPrice } from "@/hooks/useEthPrice";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/coinbase";
import { TrendingUp, TrendingDown, BarChart2, Euro } from "lucide-react";
import dynamic from "next/dynamic";

const EthCrystal3D = dynamic(() => import("./EthCrystal3D"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />,
});

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: "green" | "red" | "white" | "grey";
}) {
  const iconColor = {
    green: "text-green-400",
    red:   "text-red-400",
    white: "text-white",
    grey:  "text-ink-4",
  }[color];

  return (
    <div className="rounded-xl border border-surface-4/50 bg-surface-2/60 backdrop-blur-sm p-4 hover:border-surface-5 transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-ink-5 font-medium">{label}</span>
        <Icon className={cn("w-3.5 h-3.5 mt-0.5", iconColor)} />
      </div>
      <p className="text-base font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-ink-5 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PriceHero() {
  const { price, loading, lastTick } = useEthPrice(30000);
  const isUp = (price?.changePercent24h ?? 0) >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-4/50 bg-black min-h-[400px] flex flex-col">
      {/* 3D background */}
      <EthCrystal3D />

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/70 via-black/20 to-black/90 pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-7">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2/70 border border-surface-4/60 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] text-ink-3 font-medium tracking-wide">LIVE</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-surface-2/70 border border-surface-4/60 backdrop-blur-sm text-[11px] text-ink-4 tracking-wide">
              ETH / USD · Coinbase
            </div>
          </div>
          <span className="text-xs text-ink-5 font-mono hidden sm:block">
            {price?.lastUpdated ? new Date(price.lastUpdated).toLocaleTimeString() : ""}
          </span>
        </div>

        {/* Price */}
        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            key={price?.usd}
            animate={lastTick ? { y: [0, lastTick === "up" ? -5 : 5, 0] } : {}}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {loading ? (
              <div className="h-16 w-56 rounded-xl bg-surface-3/50 animate-pulse mb-3" />
            ) : (
              <h1
                className={cn(
                  "text-6xl md:text-7xl font-black tabular-nums tracking-tight leading-none mb-1 transition-colors duration-300",
                  lastTick === "up"   ? "text-green-400" : "",
                  lastTick === "down" ? "text-red-400"   : "text-white",
                )}
              >
                {formatCurrency(price?.usd ?? 0)}
              </h1>
            )}
          </motion.div>

          {/* EUR sub-price */}
          {!loading && price && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-4">
              <span className="text-xl font-semibold text-ink-4 tabular-nums">
                ≈ {formatCurrency(price.eur, "EUR")}
              </span>
            </motion.div>
          )}

          {/* 24h badge */}
          <AnimatePresence mode="wait">
            {!loading && price && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold backdrop-blur-sm",
                  isUp
                    ? "bg-green-400/10 border-green-400/20 text-green-400"
                    : "bg-red-400/10 border-red-400/20 text-red-400"
                )}>
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span className="tabular-nums">{formatPercent(price.changePercent24h)}</span>
                  <span className="text-xs opacity-70 tabular-nums">
                    ({price.change24h >= 0 ? "+" : ""}{formatCurrency(price.change24h)})
                  </span>
                </div>
                <span className="text-xs text-ink-5">24h change</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
          <StatCard label="24h High"   value={loading ? "—" : formatCurrency(price?.high24h ?? 0)}       icon={TrendingUp}  color="green" />
          <StatCard label="24h Low"    value={loading ? "—" : formatCurrency(price?.low24h ?? 0)}        icon={TrendingDown} color="red"  />
          <StatCard label="24h Volume" value={loading ? "—" : formatLargeNumber(price?.volume24h ?? 0)}  icon={BarChart2}   color="grey"  sub="ETH" />
          <StatCard label="EUR Price"  value={loading ? "—" : formatCurrency(price?.eur ?? 0, "EUR")}    icon={Euro}        color="white" />
        </div>
      </div>
    </div>
  );
}
