"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useBtcPrice, useFlippeningCandles } from "@/hooks/useFlippening";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/coinbase";
import { Zap, TrendingUp, TrendingDown, ArrowRight, Activity, Clock, BarChart2 } from "lucide-react";

const FlippeningChart = dynamic(() => import("@/components/FlippeningChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl border border-surface-4/50 bg-surface-1 h-[440px] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
    </div>
  ),
});

// Approximate supplies
const ETH_SUPPLY = 120_400_000;
const BTC_SUPPLY =  19_700_000;

// ── Progress bar ─────────────────────────────────────────────────────────────
function FlippeningProgress({
  currentPct,
  peakPct,
  loading,
}: {
  currentPct: number;
  peakPct:    number;
  loading:    boolean;
}) {
  const clamped    = Math.min(currentPct, 100);
  const peakClamped = Math.min(peakPct, 100);
  const flipped    = currentPct >= 100;

  return (
    <div className="rounded-2xl border border-surface-4/50 bg-surface-1 p-6 shadow-card space-y-5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-ink-4" />
            Flippening Progress
          </h2>
          <p className="text-xs text-ink-5 mt-0.5">ETH market cap as % of BTC market cap</p>
        </div>
        <div className={cn(
          "text-3xl font-black tabular-nums",
          flipped ? "text-green-400" : "text-white"
        )}>
          {loading ? "—" : `${currentPct.toFixed(2)}%`}
        </div>
      </div>

      {/* Bar */}
      <div className="space-y-2">
        <div className="relative h-5 bg-surface-3 rounded-full overflow-hidden border border-surface-5">
          {/* Historical peak marker */}
          {peakClamped > 0 && (
            <div
              className="absolute top-0 w-px h-full bg-white/30 z-10"
              style={{ left: `${peakClamped}%` }}
            />
          )}

          {/* Progress fill */}
          <motion.div
            className={cn(
              "h-full rounded-full relative overflow-hidden",
              flipped
                ? "bg-green-500"
                : "bg-white"
            )}
            initial={{ width: 0 }}
            animate={{ width: loading ? "0%" : `${clamped}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Shimmer */}
            {!flipped && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                style={{ backgroundSize: "200% 100%" }} />
            )}
          </motion.div>
        </div>

        {/* Axis labels */}
        <div className="flex items-center justify-between text-[11px] text-ink-5">
          <span>0%</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-px bg-white/25" />
            <span className="text-ink-4">ATH {peakClamped.toFixed(1)}%</span>
          </div>
          <span className={cn(flipped ? "text-green-400 font-semibold" : "")}>100% 🔁</span>
        </div>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="text-center rounded-xl bg-surface-2 border border-surface-4/50 py-3 px-2">
            <p className="text-[11px] text-ink-5 mb-1">Still needed</p>
            <p className="text-lg font-bold text-white tabular-nums">
              {flipped ? "Done ✓" : `${(100 - currentPct).toFixed(1)}%`}
            </p>
          </div>
          <div className="text-center rounded-xl bg-surface-2 border border-surface-4/50 py-3 px-2">
            <p className="text-[11px] text-ink-5 mb-1">ETH must ×</p>
            <p className="text-lg font-bold text-white tabular-nums">
              {flipped ? "—" : `${(100 / currentPct).toFixed(2)}×`}
            </p>
            <p className="text-[10px] text-ink-5">vs BTC</p>
          </div>
          <div className="text-center rounded-xl bg-surface-2 border border-surface-4/50 py-3 px-2">
            <p className="text-[11px] text-ink-5 mb-1">All-time high</p>
            <p className="text-lg font-bold text-white tabular-nums">{peakClamped.toFixed(2)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Metrics strip ─────────────────────────────────────────────────────────────
function MetricPair({
  label, ethVal, btcVal, ethColor, btcColor,
}: {
  label: string;
  ethVal: string;
  btcVal: string;
  ethColor?: string;
  btcColor?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-4/50 bg-surface-2/60 p-4">
      <p className="text-[11px] text-ink-5 mb-3 uppercase tracking-wider">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />ETH
          </span>
          <span className={cn("text-sm font-bold tabular-nums font-mono", ethColor ?? "text-white")}>{ethVal}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block" />BTC
          </span>
          <span className={cn("text-sm font-bold tabular-nums font-mono", btcColor ?? "text-ink-3")}>{btcVal}</span>
        </div>
      </div>
    </div>
  );
}

// ── What if? scenarios ────────────────────────────────────────────────────────
function WhatIfScenarios({
  ethPrice,
  btcPrice,
  currentRatio,
}: {
  ethPrice: number;
  btcPrice: number;
  currentRatio: number; // ETH_MC / BTC_MC
}) {
  if (!ethPrice || !btcPrice) return null;

  // ETH price needed at various BTC price levels to flip
  const btcScenarios = [
    { label: "BTC stays flat",  btcFactor: 1 },
    { label: "BTC −30%",        btcFactor: 0.7 },
    { label: "BTC +50%",        btcFactor: 1.5 },
    { label: "BTC +100%",       btcFactor: 2 },
  ];

  // ETH price required = (btcScenarioPrice × BTC_SUPPLY) / ETH_SUPPLY
  // i.e. where ETH_MC = BTC_MC
  return (
    <div className="rounded-2xl border border-surface-4/50 bg-surface-1 p-6 shadow-card space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-ink-4" />
        <h3 className="text-sm font-bold text-white">What ETH Price Would Flip BTC?</h3>
      </div>
      <p className="text-xs text-ink-5">
        ETH market cap must equal BTC market cap.
        At different BTC price levels, here is the ETH price required:
      </p>

      <div className="grid grid-cols-2 gap-3">
        {btcScenarios.map((s) => {
          const newBtcPrice  = btcPrice * s.btcFactor;
          const flipEthPrice = (newBtcPrice * BTC_SUPPLY) / ETH_SUPPLY;
          const xNeeded      = flipEthPrice / ethPrice;
          const isHighlighted = s.btcFactor === 1;

          return (
            <div
              key={s.label}
              className={cn(
                "rounded-xl border p-4 space-y-2",
                isHighlighted
                  ? "border-surface-6 bg-surface-3"
                  : "border-surface-4/50 bg-surface-2/60"
              )}
            >
              <p className="text-[11px] text-ink-5">{s.label}</p>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-ink-4">BTC</span>
                <span className="text-xs font-mono text-ink-3">{formatCurrency(newBtcPrice)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-ink-4">ETH needed</span>
                <span className="text-sm font-bold font-mono text-white">{formatCurrency(flipEthPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-5">Multiplier</span>
                <span className={cn(
                  "text-xs font-mono font-semibold",
                  xNeeded <= 3 ? "text-green-400" : xNeeded <= 8 ? "text-white" : "text-ink-3"
                )}>
                  {xNeeded.toFixed(1)}×
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Context blurb cards ───────────────────────────────────────────────────────
function ContextCard({ title, body, icon: Icon }: {
  title: string; body: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-surface-4/50 bg-surface-2/60 p-5 space-y-2 hover:border-surface-5 transition-all">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-ink-4" />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <p className="text-xs text-ink-4 leading-relaxed">{body}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function FlippeningPage() {
  const { price: eth, loading: ethLoading } = useEthPrice();
  const { btc,        loading: btcLoading } = useBtcPrice();
  const { series, peak, loading: candleLoading } = useFlippeningCandles("5Y");

  const loading = ethLoading || btcLoading;

  const ethPrice = eth?.usd ?? 0;
  const btcPrice = btc?.price ?? 0;
  const ethMC    = ethPrice * ETH_SUPPLY;
  const btcMC    = btcPrice * BTC_SUPPLY;
  const ratio    = btcMC > 0 ? ethMC / btcMC : 0;
  const pct      = ratio * 100;
  const peakPct  = peak * 100;

  // ETH/BTC price ratio
  const pricePair = btcPrice > 0 ? ethPrice / btcPrice : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Page header ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-ink-4" />
            The Flippening
          </h1>
          <p className="text-sm text-ink-4 mt-1 max-w-xl">
            Can Ethereum overtake Bitcoin by market capitalisation?
            Track the live ratio, historical peak, and what ETH price would seal it.
          </p>
        </div>

        {/* ETH/BTC live ratio badge */}
        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
          <div className="px-3 py-2 rounded-xl border border-surface-4/50 bg-surface-2 text-xs font-mono">
            <span className="text-ink-5">ETH/BTC </span>
            <span className="text-white tabular-nums">{loading ? "—" : pricePair.toFixed(6)}</span>
          </div>
          <p className="text-[11px] text-ink-5">price ratio</p>
        </div>
      </div>

      {/* ── Progress bar + companion metrics ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <FlippeningProgress
            currentPct={pct}
            peakPct={peakPct}
            loading={loading || (candleLoading && peakPct === 0)}
          />
        </div>

        <div className="space-y-4">
          {/* ETH vs BTC arrow */}
          <div className="rounded-2xl border border-surface-4/50 bg-surface-1 p-5 shadow-card flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="text-[11px] text-ink-5 mb-1">ETH Market Cap</p>
              <p className="text-xl font-black text-white tabular-nums">
                {loading ? "—" : `$${formatLargeNumber(ethMC)}`}
              </p>
              {eth && (
                <p className={cn(
                  "text-xs font-mono mt-1",
                  eth.changePercent24h >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {formatPercent(eth.changePercent24h)}
                </p>
              )}
            </div>
            <ArrowRight className="w-5 h-5 text-ink-5 flex-shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-[11px] text-ink-5 mb-1">BTC Market Cap</p>
              <p className="text-xl font-black text-ink-3 tabular-nums">
                {loading ? "—" : `$${formatLargeNumber(btcMC)}`}
              </p>
              {btc && (
                <p className={cn(
                  "text-xs font-mono mt-1",
                  btc.changePercent24h >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {formatPercent(btc.changePercent24h)}
                </p>
              )}
            </div>
          </div>

          {/* Gap */}
          <div className="rounded-xl border border-surface-4/50 bg-surface-2/60 p-4 text-center">
            <p className="text-[11px] text-ink-5 mb-1">Market Cap Gap</p>
            <p className="text-2xl font-black text-white tabular-nums">
              {loading ? "—" : `$${formatLargeNumber(Math.abs(btcMC - ethMC))}`}
            </p>
            <p className="text-xs text-ink-5 mt-1">BTC leads ETH by this amount</p>
          </div>
        </div>
      </div>

      {/* ── Metric pairs ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricPair
          label="Price"
          ethVal={loading ? "—" : formatCurrency(ethPrice)}
          btcVal={loading ? "—" : formatCurrency(btcPrice)}
        />
        <MetricPair
          label="24h Change"
          ethVal={loading ? "—" : formatPercent(eth?.changePercent24h ?? 0)}
          btcVal={loading ? "—" : formatPercent(btc?.changePercent24h ?? 0)}
          ethColor={!loading && (eth?.changePercent24h ?? 0) >= 0 ? "text-green-400" : "text-red-400"}
          btcColor={!loading && (btc?.changePercent24h ?? 0) >= 0 ? "text-green-400" : "text-red-400"}
        />
        <MetricPair
          label="24h Volume"
          ethVal={loading ? "—" : formatLargeNumber(eth?.volume24h ?? 0)}
          btcVal={loading ? "—" : formatLargeNumber(btc?.volume24h ?? 0)}
        />
        <MetricPair
          label="Approx. Supply"
          ethVal="120.4M ETH"
          btcVal="19.7M BTC"
        />
      </div>

      {/* ── Main ratio chart ─────────────────────────── */}
      <FlippeningChart />

      {/* ── What if scenarios + context ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WhatIfScenarios
          ethPrice={ethPrice}
          btcPrice={btcPrice}
          currentRatio={ratio}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-ink-4" />
            <h3 className="text-sm font-bold text-white">Context</h3>
          </div>
          <ContextCard
            icon={Zap}
            title="What is the Flippening?"
            body="The Flippening refers to the hypothetical moment when Ethereum's market capitalisation surpasses Bitcoin's. It would mark a fundamental shift in the crypto market's perceived store of value."
          />
          <ContextCard
            icon={TrendingUp}
            title="Why market cap, not price?"
            body="ETH and BTC have very different supplies (~120M vs ~19.7M). A 1:1 price comparison is meaningless — market cap (price × supply) is the fair measure of relative network value."
          />
          <ContextCard
            icon={Clock}
            title="Historical context"
            body="The closest ETH ever came was during the 2021 bull run, when the ETH/BTC market-cap ratio reached roughly 70–75%. ETH has historically tracked below that peak since."
          />
          <ContextCard
            icon={TrendingDown}
            title="What would it take?"
            body="At current supplies, ETH's price must reach approximately 16.4% of BTC's price in dollar terms to flip. E.g. if BTC is $100K, ETH would need to be ~$16,400."
          />
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-ink-5 text-center pb-2">
        Market caps are estimated using fixed supply approximations (ETH ~120.4M, BTC ~19.7M). Not financial advice.
      </p>
    </div>
  );
}
