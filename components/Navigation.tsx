"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEthPrice } from "@/hooks/useEthPrice";
import { formatCurrency, cn } from "@/lib/utils";
import { BarChart2, Wallet, Zap } from "lucide-react";

// EthValue brand mark — monoline Ethereum diamond (currentColor-friendly).
const ETH_LOGO = () => (
  <svg viewBox="-10 -10 146 226" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round">
      <polygon points="63,2 122,103 63,140 4,103" />
      <polygon points="4,115 63,204 122,115" />
    </g>
    <g fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={6.5} strokeLinecap="round">
      <line x1="63" y1="8" x2="63" y2="136" />
      <line x1="63" y1="156" x2="63" y2="200" />
    </g>
  </svg>
);

const navItems = [
  { href: "/",           label: "Dashboard",   icon: BarChart2 },
  { href: "/portfolio",  label: "Portfolio",   icon: Wallet    },
  { href: "/flippening", label: "Flippening",  icon: Zap       },
];

export default function Navigation() {
  const pathname = usePathname();
  const { price, lastTick } = useEthPrice(30000);

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-4/60 bg-black/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-surface-3 border border-surface-5 flex items-center justify-center text-white group-hover:border-surface-6 transition-all">
              <ETH_LOGO />
            </div>
            <div>
              <span
                className="text-white text-sm tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <span style={{ fontWeight: 600 }}>Eth</span>
                <span style={{ fontWeight: 300 }}>Value</span>
              </span>
              <p className="text-[10px] text-ink-5 leading-none mt-0.5 tracking-wider uppercase">Beyond Spot</p>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                    isActive ? "text-white" : "text-ink-4 hover:text-ink-2 hover:bg-surface-2"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-surface-3 border border-surface-5"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Live ticker */}
          <motion.div
            key={price?.usd}
            animate={lastTick ? { y: [0, lastTick === "up" ? -2 : 2, 0] } : {}}
            transition={{ duration: 0.2 }}
            className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300",
              lastTick === "up"   && "border-green-500/30 bg-green-500/5 shadow-green-glow",
              lastTick === "down" && "border-red-500/30 bg-red-500/5 shadow-red-glow",
              !lastTick           && "border-surface-5 bg-surface-2"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className={cn(
              "tabular-nums transition-colors duration-300",
              lastTick === "up"   ? "text-green-400" : "",
              lastTick === "down" ? "text-red-400"   : "text-white",
            )}>
              {price ? formatCurrency(price.usd) : "—"}
            </span>
            {price && (
              <span className={cn(
                "tabular-nums",
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
