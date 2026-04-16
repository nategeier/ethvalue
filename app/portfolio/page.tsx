"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePortfolioStore } from "@/store/portfolio";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Euro, PieChart, Activity, Lock } from "lucide-react";

const PortfolioManager = dynamic(() => import("@/components/PortfolioManager"), { ssr: false });

function AllocationBar({ entries, ethPrice, eurPrice }: {
  entries: { id: string; label: string; amount: number }[];
  ethPrice: number;
  eurPrice: number;
}) {
  const total = entries.reduce((s, e) => s + e.amount, 0);
  if (!total || entries.length === 0) return null;

  // Greyscale ramp for bars
  const shades = [
    "#ffffff","#d4d4d4","#a3a3a3","#737373",
    "#525252","#404040","#2a2a2a","#1f1f1f",
  ];

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <PieChart className="w-4 h-4 text-ink-4" />
        <h3 className="text-sm font-semibold text-white">Allocation</h3>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ width: 0 }}
            animate={{ width: `${(entry.amount / total) * 100}%` }}
            transition={{ delay: i * 0.04, duration: 0.4, ease: "easeOut" }}
            className="h-full"
            style={{ backgroundColor: shades[i % shades.length] }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const pct    = (entry.amount / total) * 100;
          const usdVal = entry.amount * ethPrice;
          return (
            <div key={entry.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: shades[i % shades.length] }} />
                <span className="text-ink-3 truncate max-w-[140px]">{entry.label}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-ink-5">{entry.amount.toFixed(4)} ETH</span>
                <span className="text-white">{formatCurrency(usdVal)}</span>
                <span className="text-ink-5 w-9 text-right">{pct.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PriceScenarios({ ethPrice }: { ethPrice: number }) {
  const { entries } = usePortfolioStore();
  const totalEth    = entries.reduce((s, e) => s + e.amount, 0);
  if (!totalEth) return null;

  const scenarios = [
    { label: "−50%",  mult: 0.5,  color: "text-red-400",    bg: "bg-red-500/8  border-red-500/15" },
    { label: "Now",   mult: 1,    color: "text-white",       bg: "bg-surface-3  border-surface-5"  },
    { label: "2×",    mult: 2,    color: "text-green-400",   bg: "bg-green-500/8 border-green-500/15"},
    { label: "5×",    mult: 5,    color: "text-green-300",   bg: "bg-green-500/5 border-green-500/10"},
    { label: "10×",   mult: 10,   color: "text-emerald-300", bg: "bg-emerald-500/5 border-emerald-500/10"},
  ];

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-ink-4" />
        <h3 className="text-sm font-semibold text-white">Price Scenarios</h3>
        <span className="text-xs text-ink-5">— for your {totalEth.toFixed(4)} ETH</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {scenarios.map((s) => (
          <div key={s.label} className={cn("rounded-xl border p-3 text-center", s.bg)}>
            <p className="text-[11px] text-ink-5 mb-1">{s.label}</p>
            <p className={cn("text-xs font-bold tabular-nums", s.color)}>
              {formatCurrency(ethPrice * s.mult)}
            </p>
            <p className="text-[11px] text-ink-5 mt-1 tabular-nums">
              {formatCurrency(totalEth * ethPrice * s.mult, "USD", true)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { price, loading } = useEthPrice();
  const { entries, totalEth } = usePortfolioStore();

  const ethPrice = price?.usd ?? 0;
  const eurPrice = price?.eur ?? 0;
  const total    = totalEth();
  const totalUsd = total * ethPrice;
  const totalEur = total * eurPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wallet className="w-6 h-6 text-ink-4" />
            Portfolio
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Lock className="w-3 h-3 text-ink-5" />
            <p className="text-xs text-ink-5">Stored in your browser · never sent to any server · private to you</p>
          </div>
        </div>

        {/* Live price */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-4/50 bg-surface-2 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white tabular-nums">{loading ? "—" : formatCurrency(ethPrice)}</span>
          {price && (
            <span className={cn("tabular-nums", price.changePercent24h >= 0 ? "text-green-400" : "text-red-400")}>
              {formatPercent(price.changePercent24h)}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {total > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-ink-4" />
              <span className="text-xs text-ink-5 font-medium">USD Value</span>
            </div>
            <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(totalUsd)}</p>
            <p className="text-xs text-ink-5 mt-1 font-mono">
              {total.toFixed(4)} ETH × {formatCurrency(ethPrice)}
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="w-4 h-4 text-ink-4" />
              <span className="text-xs text-ink-5 font-medium">EUR Value</span>
            </div>
            <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(totalEur, "EUR")}</p>
            <p className="text-xs text-ink-5 mt-1 font-mono">
              {total.toFixed(4)} ETH × {formatCurrency(eurPrice, "EUR")}
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              {(price?.changePercent24h ?? 0) >= 0
                ? <TrendingUp  className="w-4 h-4 text-green-400" />
                : <TrendingDown className="w-4 h-4 text-red-400"  />
              }
              <span className="text-xs text-ink-5 font-medium">24h P&amp;L</span>
            </div>
            <p className={cn(
              "text-2xl font-black tabular-nums",
              (price?.changePercent24h ?? 0) >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {loading ? "—" : `${(price?.changePercent24h ?? 0) >= 0 ? "+" : ""}${formatCurrency(total * (price?.change24h ?? 0))}`}
            </p>
            <p className="text-xs text-ink-5 mt-1">
              {price ? formatPercent(price.changePercent24h) : "—"} in last 24 hours
            </p>
          </div>
        </motion.div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <PortfolioManager />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <AllocationBar entries={entries} ethPrice={ethPrice} eurPrice={eurPrice} />
          {ethPrice > 0 && <PriceScenarios ethPrice={ethPrice} />}

          {entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card p-12 flex flex-col items-center justify-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-surface-3 border border-surface-5 flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6 text-ink-5" />
              </div>
              <h3 className="text-white font-semibold mb-1">No holdings yet</h3>
              <p className="text-ink-5 text-sm max-w-xs">
                Add your ETH on the left to see allocation breakdown, live values, and price scenarios.
              </p>
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );
}
