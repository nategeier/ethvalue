export interface CandleData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EthPrice {
  usd: number;
  eur: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

export interface TxVolumePoint {
  time: number; // Unix timestamp (seconds)
  value: number; // daily transaction count
}

export interface ValidatorQueuePoint {
  time: number; // Unix timestamp (seconds)
  entryQueue: number; // ETH waiting to enter (activation queue)
  exitQueue: number; // ETH waiting to exit
}

export interface ValidatorQueueStats {
  avgEntryWaitDays: number; // avg entry-queue wait over the range
  avgExitWaitDays: number; // avg exit-queue wait over the range
  currentEntryWaitDays: number; // latest entry-queue wait
  currentExitWaitDays: number; // latest exit-queue wait
  currentEntryQueue: number; // latest entry queue (ETH)
  currentExitQueue: number; // latest exit queue (ETH)
  stakedPercent: number | null; // % of supply staked
  apr: number | null; // staking APR
}

export interface PortfolioEntry {
  id: string;
  label: string;
  amount: number;
  createdAt: string;
}

export interface PortfolioStats {
  totalEth: number;
  totalUsd: number;
  totalEur: number;
  entries: PortfolioEntry[];
}

export type TimeRange = "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "10Y";

export interface TimeRangeConfig {
  label: TimeRange;
  days: number;
  granularity: number; // seconds
}

export const TIME_RANGES: TimeRangeConfig[] = [
  { label: "1W", days: 7, granularity: 3600 },        // hourly
  { label: "1M", days: 30, granularity: 21600 },       // 6-hourly
  { label: "3M", days: 90, granularity: 86400 },       // daily
  { label: "6M", days: 180, granularity: 86400 },      // daily
  { label: "1Y", days: 365, granularity: 86400 },      // daily
  { label: "5Y", days: 365 * 5, granularity: 86400 },  // daily
  { label: "10Y", days: 365 * 10, granularity: 86400 }, // daily
];
