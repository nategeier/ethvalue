# EthValue 🔷

> **What is ETH actually worth right now beyond spot price?**

A sleek, dark-mode portfolio manager for Ethereum — real-time price data, a 10-year interactive candlestick chart, and portfolio tracking in USD & EUR.

## Features

- 📈 **10-year candlestick chart** — live OHLCV data from Coinbase Exchange API
- 💰 **Real-time ETH price** — USD + EUR, updates every 30 seconds
- 🎯 **Portfolio manager** — track multiple wallets/holdings with EUR & USD values
- 🌐 **Beyond spot price** — staking value, L2 TVL, market cap, deflationary metrics
- 🎨 **3D animated background** — custom canvas-based ETH crystal animations
- 🌑 **Dark mode** — sleek, trading-terminal aesthetic

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + custom design tokens
- **lightweight-charts v4** (TradingView) for candlestick chart
- **Framer Motion** for animations
- **Zustand** for portfolio state (persisted to localStorage)
- **Coinbase Exchange API** (public, no key required)

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

Connect your GitHub repo at [vercel.com](https://vercel.com) for one-click deployment, or use the CLI:

```bash
npm i -g vercel && vercel --prod
```

## Project Structure

```
app/                    # Next.js App Router pages + API routes
components/             # React components
  PriceHero.tsx         # Live price with 3D background
  EthCrystal3D.tsx      # Canvas 3D ETH crystal animation
  CandlestickChart.tsx  # Interactive OHLCV chart
  PortfolioManager.tsx  # Holdings tracker
  BeyondSpotMetrics.tsx # Value context metrics
hooks/                  # useEthPrice, useCandles
lib/                    # coinbase.ts API, types, utils
store/                  # Zustand portfolio persistence
```

---
*Not financial advice. Portfolio data stored locally in your browser.*
