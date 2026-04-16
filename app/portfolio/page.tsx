"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePortfolioStore } from "@/store/portfolio";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Euro, PieChart, Activity } from "lucide-react";

const PortfolioManager = dynamic(() => import("@/components/PortfolioManager"), { ssr: false });

function AllocationBar({ entries, ethPrice, eurPrice }: {
  entries: { id: string; label: string; amount: number }[];
  ethPrice: number;
  eurPrice: number;
}) {
  const total = entries.reduce((s, e) => s + e.amount, 0);
  if (!total || entries.length === 0) return null;

  const colors = [
    "#627EEA", "#A78BFA", "#34D399", "#F59E0B",
    "#F87171", "#60A5FA", "#A3E635", "#FB923C",
  ];

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <PieChart className="w-4 h-4 text-eth-purple" />
        <h3 className="text-sm font-semibold text-white">Allocation</h3>
      </div>

      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ width: 0 }}
            animate={{ width: `${(entry.amount / total) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const pct = (entry.amount / total) * 100;
          const usdVal = entry.amount * ethPrice;
          return (
            <div key={entry.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-slate-300 truncate max-w-[140px]">{entry.label}</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="text-slate-500 font-mono">{entry.amount.toFixed(4)} ETH</span>
                <span className="text-white font-mono">{formatCurrency(usdVal)}</span>
                <span className="text-slate-500 w-10 text-right">{pct.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PriceScenarios({ ethPrice }: { ethPrice: number }) {
  const scenarios = [
    { label: "Bear Case", multiplier: 0.5, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
    { label: "Current", multiplier: 1, color: "text-white", bg: "bg-eth-purple/10 border-eth-purple/20" },
    { label: "2x", multiplier: 2, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
    { label: "5x", multiplier: 5, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
    { label: "10x", multiplier: 10, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  ];

  const { entries } = usePortfolioStore();
  const totalEth = entries.reduce((s, e) => s + e.amount, 0);

  if (!totalEth) return null;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-eth-purple" />
        <h3 className="text-sm font-semibold text-white">Price Scenarios</h3>
        <span className="text-xs text-slate-500">— for your {totalEth.toFixed(4)} ETH</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {scenarios.map((s) => (
          <div key={s.label} className={cn("rounded-xl border p-3 text-center", s.bg)}>
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={cn("text-sm font-bold tabular-nums", s.color)}>
              {formatCurrency(ethPrice * s.multiplier)}
            </p>
            <p className="text-xs text-slate-600 mt-1 tabular-nums">
              {formatCurrency(totalEth * ethPrice * s.multiplier, "USD", true)}
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
  const total = totalEth();
  const totalUsd = total * ethPrice;
  const totalEur = total * eurPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-eth-purple/10 border border-eth-purple/20">
              <Wallet className="w-5 h-5 text-eth-purple" />
            </div>
            Portfolio
          </h1>
          <p className="text-slate-500 text-sm mt-1">Your ETH holdings at current market value</p>
        </div>

        {/* Live price badge */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-eth-border/30 bg-eth-card/40">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white font-mono tabular-nums">
            {loading ? "—" : formatCurrency(ethPrice)}
          </span>
          {price && (
            <span className={cn(
              "text-xs tabular-nums font-mono",
              price.changePercent24h >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {formatPercent(price.changePercent24h)}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {total > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-500 font-medium">USD Value</span>
            </div>
            <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(totalUsd)}</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">{total.toFixed(4)} ETH × {formatCurrency(ethPrice)}</p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-500 font-medium">EUR Value</span>
            </div>
            <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(totalEur, "EUR")}</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">{total.toFixed(4)} ETH × {formatCurrency(eurPrice, "EUR")}</p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              {(price?.changePercent24h ?? 0) >= 0
                ? <TrendingUp className="w-4 h-4 text-green-400" />
                : <TrendingDown className="w-4 h-4 text-red-400" />
              }
              <span className="text-xs text-slate-500 font-medium">24h P&amp;L</span>
            </div>
            <p className={cn(
              "text-2xl font-black tabular-nums",
              (price?.changePercent24h ?? 0) >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {loading ? "—" : `${(price?.changePercent24h ?? 0) >= 0 ? "+" : ""}${formatCurrency(total * (price?.change24h ?? 0))}`}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {price ? formatPercent(price.changePercent24h) : "—"} in last 24 hours
            </p>
          </div>
        </motion.div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Portfolio manager */}
        <div className="lg:col-span-2">
          <PortfolioManager />
        </div>

        {/* Analytics */}
        <div className="lg:col-span-3 space-y-4">
          <AllocationBar entries={entries} ethPrice={ethPrice} eurPrice={eurPrice} />
          {ethPrice > 0 && <PriceScenarios ethPrice={ethPrice} />}

          {entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-eth-purple/10 border border-eth-purple/20 flex items-center justify-center mb-4">
                <PieChart className="w-7 h-7 text-eth-purple/50" />
              </div>
              <h3 className="text-white font-semibold mb-1">No holdings yet</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                Add your ETH holdings in the panel on the left to see portfolio analytics, allocation breakdown, and price scenarios.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-600 text-center pb-4">
        Holdings are stored locally in your browser. Nothing is sent to any server.
      </p>
    </div>
  );
}
