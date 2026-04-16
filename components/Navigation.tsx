"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEthPrice } from "@/hooks/useEthPrice";
import { formatCurrency, cn } from "@/lib/utils";
import { BarChart2, Wallet, Zap } from "lucide-react";

const ETH_LOGO = () => (
  <svg viewBox="0 0 784.37 1277.39" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <g>
      <polygon fill="currentColor" fillOpacity="0.9" points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54"/>
      <polygon fill="currentColor" fillOpacity="0.6" points="392.07,0 -0,650.54 392.07,882.29 392.07,472.33"/>
      <polygon fill="currentColor" fillOpacity="0.45" points="392.07,956.52 387.24,962.41 387.24,1250.09 392.07,1264.42 784.37,724.89"/>
      <polygon fill="currentColor" fillOpacity="0.8" points="392.07,1264.42 392.07,956.52 -0,724.89"/>
      <polygon fill="currentColor" fillOpacity="0.25" points="392.07,882.29 784.13,650.54 392.07,472.33"/>
      <polygon fill="currentColor" fillOpacity="0.15" points="-0,650.54 392.07,882.29 392.07,472.33"/>
    </g>
  </svg>
);

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart2 },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
];

export default function Navigation() {
  const pathname = usePathname();
  const { price, lastTick } = useEthPrice(30000);

  return (
    <nav className="sticky top-0 z-50 border-b border-eth-border/30 bg-eth-darker/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg bg-eth-purple/10 border border-eth-purple/20 flex items-center justify-center text-eth-purple group-hover:border-eth-purple/40 transition-all duration-300">
              <ETH_LOGO />
              <div className="absolute inset-0 rounded-lg bg-eth-purple/5 group-hover:bg-eth-purple/15 transition-colors" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">EthValue</span>
              <div className="flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-eth-purple" />
                <span className="text-[10px] text-eth-purple/70 font-mono">beyond spot</span>
              </div>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-white hover:bg-eth-card/40"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-eth-card/80 border border-eth-border/50"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Live price ticker */}
          <motion.div
            key={price?.usd}
            animate={lastTick ? { y: [0, lastTick === "up" ? -2 : 2, 0] } : {}}
            transition={{ duration: 0.2 }}
            className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
              lastTick === "up" && "border-green-400/30 bg-green-400/5",
              lastTick === "down" && "border-red-400/30 bg-red-400/5",
              !lastTick && "border-eth-border/30 bg-eth-card/40",
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono text-white tabular-nums">
              {price ? formatCurrency(price.usd) : "Loading..."}
            </span>
            {price && (
              <span className={cn(
                "text-xs font-mono tabular-nums",
                price.changePercent24h >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {price.changePercent24h >= 0 ? "+" : ""}{price.changePercent24h.toFixed(2)}%
              </span>
            )}
          </motion.div>
        </div>
      </div>
    </nav>
  );
}
