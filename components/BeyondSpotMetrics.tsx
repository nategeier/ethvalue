"use client";

import { motion } from "framer-motion";
import { useEthPrice } from "@/hooks/useEthPrice";
import { formatCurrency } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/coinbase";
import { Flame, Layers, Shield, Zap, Globe, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ETH_SUPPLY       = 120_000_000;
const ETH_STAKED_RATIO = 0.28;
const LAYER2_TVL_USD   = 15_000_000_000;

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  delay?: number;
}

function MetricCard({ title, value, subtitle, icon: Icon, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="group relative rounded-xl border border-surface-4/50 bg-surface-2/60 p-5 overflow-hidden hover:border-surface-5 hover:bg-surface-2 transition-all duration-300 cursor-default"
    >
      {/* subtle top-edge highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-surface-3 border border-surface-5 flex-shrink-0 mt-0.5 group-hover:bg-surface-4 transition-colors">
          <Icon className="w-3.5 h-3.5 text-ink-4" />
        </div>
        <div>
          <p className="text-xs text-ink-5 font-medium mb-1">{title}</p>
          <p className="text-lg font-bold text-white tabular-nums">{value}</p>
          <p className="text-xs text-ink-5 mt-1 leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function BeyondSpotMetrics() {
  const { price } = useEthPrice();
  const usd = price?.usd ?? 0;

  const marketCap    = usd * ETH_SUPPLY;
  const stakedEth    = ETH_SUPPLY * ETH_STAKED_RATIO;
  const stakedValue  = stakedEth * usd;
  const networkRevenue = price?.volume24h ? price.volume24h * 0.001 * usd : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">What is ETH actually worth?</h2>
          <p className="text-xs text-ink-5 mt-0.5 tracking-wide uppercase">Beyond spot price</p>
        </div>
        <div className="flex-1 h-px bg-surface-4/50" />
      </div>

      <p className="text-sm text-ink-4 leading-relaxed max-w-2xl">
        The spot price is one signal. ETH also generates real economic value through staking yields,
        fee revenue, and as the settlement layer for a global decentralised ecosystem.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Network Market Cap"
          value={usd ? `$${formatLargeNumber(marketCap)}` : "—"}
          subtitle={`~${(ETH_SUPPLY / 1e6).toFixed(0)}M ETH in circulation`}
          icon={Globe}
          delay={0}
        />
        <MetricCard
          title="Staked ETH Value"
          value={usd ? `$${formatLargeNumber(stakedValue)}` : "—"}
          subtitle={`≈${(ETH_STAKED_RATIO * 100).toFixed(0)}% of supply earning ~3.5% APY`}
          icon={Shield}
          delay={0.04}
        />
        <MetricCard
          title="Est. Daily Fee Revenue"
          value={usd && price?.volume24h ? `$${formatLargeNumber(networkRevenue)}` : "—"}
          subtitle="Gas fees burned &amp; distributed to validators"
          icon={Flame}
          delay={0.08}
        />
        <MetricCard
          title="L2 Ecosystem TVL"
          value={`$${formatLargeNumber(LAYER2_TVL_USD)}`}
          subtitle="Arbitrum, Base, Optimism, zkSync &amp; more"
          icon={Layers}
          delay={0.12}
        />
        <MetricCard
          title="Programmable Value"
          value="$100B+ DeFi"
          subtitle="ETH secures the largest DeFi ecosystem"
          icon={Zap}
          delay={0.16}
        />
        <MetricCard
          title="Monetary Policy"
          value="Deflationary"
          subtitle="Post-Merge EIP-1559 burns more ETH than is issued"
          icon={TrendingUp}
          delay={0.20}
        />
      </div>

      <p className="text-[11px] text-ink-5 pt-1">
        * Estimates based on ~120M ETH circulating supply and public staking data. Not financial advice.
      </p>
    </div>
  );
}
