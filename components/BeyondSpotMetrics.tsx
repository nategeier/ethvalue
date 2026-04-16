"use client";

import { motion } from "framer-motion";
import { useEthPrice } from "@/hooks/useEthPrice";
import { formatCurrency, cn } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/coinbase";
import { Flame, Layers, Shield, Zap, Globe, TrendingUp } from "lucide-react";

// ETH-specific metrics and context
const ETH_SUPPLY = 120_000_000; // approx circulating supply
const ETH_STAKED_RATIO = 0.28; // ~28% staked
const LAYER2_TVL_USD = 15_000_000_000; // ~$15B in L2s (illustrative)

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}

function MetricCard({ title, value, subtitle, icon: Icon, gradient, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="group relative rounded-xl border border-eth-border/30 bg-eth-card/40 backdrop-blur-sm p-5 overflow-hidden hover:border-eth-border/60 transition-all duration-300 cursor-default"
    >
      {/* Gradient background */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-eth-purple/10 border border-eth-purple/20 group-hover:bg-eth-purple/20 transition-colors">
            <Icon className="w-4 h-4 text-eth-purple" />
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium mb-1">{title}</p>
        <p className="text-xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>
      </div>
    </motion.div>
  );
}

export default function BeyondSpotMetrics() {
  const { price } = useEthPrice();
  const usd = price?.usd ?? 0;

  const marketCap = usd * ETH_SUPPLY;
  const stakedEth = ETH_SUPPLY * ETH_STAKED_RATIO;
  const stakedValue = stakedEth * usd;
  const networkRevenue = price?.volume24h ? price.volume24h * 0.001 * usd : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-white">What is ETH actually worth?</h2>
        <span className="px-2 py-0.5 rounded-full bg-eth-purple/10 border border-eth-purple/20 text-xs text-eth-lavender">
          Beyond spot price
        </span>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">
        ETH spot price is just one lens. The network generates real economic value through staking yields,
        fee revenue, and as the settlement layer for a global decentralized ecosystem.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Network Market Cap"
          value={usd ? `$${formatLargeNumber(marketCap)}` : "—"}
          subtitle={`~${(ETH_SUPPLY / 1e6).toFixed(0)}M ETH in circulation`}
          icon={Globe}
          gradient="bg-gradient-to-br from-eth-purple/10 via-transparent to-transparent"
          delay={0}
        />
        <MetricCard
          title="Staked ETH Value"
          value={usd ? `$${formatLargeNumber(stakedValue)}` : "—"}
          subtitle={`≈${(ETH_STAKED_RATIO * 100).toFixed(0)}% of supply earning ~3.5% APY`}
          icon={Shield}
          gradient="bg-gradient-to-br from-blue-500/10 via-transparent to-transparent"
          delay={0.05}
        />
        <MetricCard
          title="Est. Daily Fee Revenue"
          value={usd && price?.volume24h ? `$${formatLargeNumber(networkRevenue)}` : "—"}
          subtitle="Gas fees burned & distributed to validators"
          icon={Flame}
          gradient="bg-gradient-to-br from-orange-500/10 via-transparent to-transparent"
          delay={0.1}
        />
        <MetricCard
          title="L2 Ecosystem TVL"
          value={`$${formatLargeNumber(LAYER2_TVL_USD)}`}
          subtitle="Arbitrum, Base, Optimism, zkSync & more"
          icon={Layers}
          gradient="bg-gradient-to-br from-green-500/10 via-transparent to-transparent"
          delay={0.15}
        />
        <MetricCard
          title="Programmable Value"
          value="$100B+ DeFi"
          subtitle="ETH secures the largest DeFi ecosystem"
          icon={Zap}
          gradient="bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent"
          delay={0.2}
        />
        <MetricCard
          title="Sound Money Score"
          value="Deflationary"
          subtitle="Post-Merge EIP-1559 burns more than issued"
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-purple-500/10 via-transparent to-transparent"
          delay={0.25}
        />
      </div>

      <p className="text-xs text-slate-600 mt-2">
        * Market cap and staking figures are estimates based on approximate circulating supply (~120M ETH) and public staking data. Not financial advice.
      </p>
    </div>
  );
}
