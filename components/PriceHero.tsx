"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEthPrice } from "@/hooks/useEthPrice";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/coinbase";
import { TrendingUp, TrendingDown, Activity, BarChart2, DollarSign, Euro } from "lucide-react";
import dynamic from "next/dynamic";

const EthCrystal3D = dynamic(() => import("./EthCrystal3D"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-eth-darker" />,
});

function StatCard({ label, value, sub, icon: Icon, color = "purple" }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: "purple" | "green" | "red" | "blue";
}) {
  const colorMap = {
    purple: "text-eth-purple border-eth-purple/20 bg-eth-purple/10",
    green: "text-green-400 border-green-400/20 bg-green-400/10",
    red: "text-red-400 border-red-400/20 bg-red-400/10",
    blue: "text-blue-400 border-blue-400/20 bg-blue-400/10",
  };

  return (
    <div className="rounded-xl border border-eth-border/30 bg-eth-card/40 backdrop-blur-sm p-4 hover:border-eth-border/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <div className={cn("p-1.5 rounded-lg border", colorMap[color])}>
          <Icon className="w-3 h-3" />
        </div>
      </div>
      <p className="text-lg font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PriceHero() {
  const { price, loading, lastTick } = useEthPrice(30000);

  const isUp = (price?.changePercent24h ?? 0) >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-eth-border/30 bg-eth-darker min-h-[420px] flex flex-col">
      {/* 3D background */}
      <EthCrystal3D />

      {/* Scanline effect */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden opacity-[0.02]">
        <div className="absolute w-full h-0.5 bg-white animate-scanline" />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-eth-darker/60 via-transparent to-eth-darker/90 pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-eth-darker/40 via-transparent to-eth-darker/40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-8">
        {/* Live badge */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-eth-card/60 border border-eth-border/30 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">LIVE</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-eth-card/60 border border-eth-border/30 backdrop-blur-sm text-xs text-slate-400">
              ETH/USD • Coinbase
            </div>
          </div>
          <div className="text-xs text-slate-600 font-mono">
            {price?.lastUpdated ? new Date(price.lastUpdated).toLocaleTimeString() : "—"}
          </div>
        </div>

        {/* Main price */}
        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            key={price?.usd}
            animate={lastTick ? {
              scale: [1, 1.02, 1],
              y: [0, lastTick === "up" ? -4 : 4, 0],
            } : {}}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-2"
          >
            <div className="flex items-end gap-4">
              {loading ? (
                <div className="h-16 w-64 rounded-xl bg-eth-card/40 animate-pulse" />
              ) : (
                <div className={cn(
                  "relative",
                  lastTick === "up" && "text-green-400",
                  lastTick === "down" && "text-red-400",
                )}>
                  <h1 className="text-6xl md:text-7xl font-black text-white tabular-nums tracking-tight leading-none"
                    style={{ textShadow: "0 0 40px rgba(98, 126, 234, 0.3)" }}
                  >
                    {formatCurrency(price?.usd ?? 0)}
                  </h1>
                  {/* Glow behind price */}
                  <div className="absolute inset-0 blur-3xl opacity-20 pointer-events-none"
                    style={{ background: isUp ? "rgba(0,255,136,0.5)" : "rgba(255,59,48,0.5)" }}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* EUR price */}
          {!loading && price && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <span className="text-2xl font-semibold text-slate-400 tabular-nums">
                ≈ {formatCurrency(price.eur, "EUR")}
              </span>
              <span className="text-slate-600 text-sm">EUR</span>
            </motion.div>
          )}

          {/* 24h change */}
          <AnimatePresence mode="wait">
            {!loading && price && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm",
                  isUp
                    ? "bg-green-400/10 border-green-400/20 text-green-400"
                    : "bg-red-400/10 border-red-400/20 text-red-400"
                )}>
                  {isUp ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span className="text-sm font-bold tabular-nums">
                    {formatPercent(price.changePercent24h)}
                  </span>
                  <span className="text-xs opacity-70 tabular-nums">
                    ({price.change24h >= 0 ? "+" : ""}{formatCurrency(price.change24h)})
                  </span>
                </div>
                <span className="text-xs text-slate-600">24h change</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <StatCard
            label="24h High"
            value={loading ? "—" : formatCurrency(price?.high24h ?? 0)}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="24h Low"
            value={loading ? "—" : formatCurrency(price?.low24h ?? 0)}
            icon={TrendingDown}
            color="red"
          />
          <StatCard
            label="24h Volume"
            value={loading ? "—" : formatLargeNumber(price?.volume24h ?? 0)}
            sub="ETH traded"
            icon={BarChart2}
            color="purple"
          />
          <StatCard
            label="EUR Price"
            value={loading ? "—" : formatCurrency(price?.eur ?? 0, "EUR")}
            icon={Euro}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}
