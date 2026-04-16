import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency: "USD" | "EUR" = "USD",
  compact = false
): string {
  if (compact) {
    if (value >= 1e9) return `${currency === "USD" ? "$" : "€"}${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${currency === "USD" ? "$" : "€"}${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${currency === "USD" ? "$" : "€"}${(value / 1e3).toFixed(2)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
