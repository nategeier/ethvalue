"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
} from "lightweight-charts";
import { useFlippeningCandles, type RatioPoint } from "@/hooks/useFlippening";
import type { TimeRange } from "@/lib/types";
import { TIME_RANGES } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Ranges that make sense for the flippening chart (exclude 1W — too short)
const FLIP_RANGES: typeof TIME_RANGES = TIME_RANGES.filter((r) =>
  ["1M","3M","6M","1Y","5Y","10Y"].includes(r.label)
);

interface Tooltip {
  time: number;
  pct: number;
  ethClose: number;
  btcClose: number;
  pricePair: number;
  x: number;
  y: number;
}

export default function FlippeningChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRef      = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const peakLineRef  = useRef<ISeriesApi<any> | null>(null);

  const [range, setRange]     = useState<TimeRange>("5Y");
  const { series, peak, loading, error, refetch } = useFlippeningCandles(range);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  // ── chart init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor:   "rgba(115,115,115,0.9)",
        fontFamily:  "'Inter', -apple-system, sans-serif",
        fontSize:    11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.2)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1f1f1f" },
        horzLine: { color: "rgba(255,255,255,0.2)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1f1f1f" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale:  { mouseWheel: true, pinch: true },
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      localization: {
        priceFormatter: (p: number) => `${p.toFixed(2)}%`,
      },
    });

    // Main ratio area series
    const lineSeries = chart.addAreaSeries({
      lineColor:        "rgba(255,255,255,0.85)",
      topColor:         "rgba(255,255,255,0.12)",
      bottomColor:      "rgba(255,255,255,0.01)",
      lineWidth:        2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius:  4,
      crosshairMarkerBorderColor: "#ffffff",
      crosshairMarkerBackgroundColor: "#ffffff",
      priceFormat: { type: "custom", formatter: (p: number) => `${p.toFixed(2)}%` },
    });

    // 100% target line
    const targetLine = chart.addLineSeries({
      color:        "rgba(255,255,255,0.18)",
      lineWidth:    1,
      lineStyle:    LineStyle.Dashed,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      priceFormat: { type: "custom", formatter: (p: number) => `${p.toFixed(2)}%` },
    });

    chartRef.current    = chart;
    lineRef.current     = lineSeries;
    peakLineRef.current = targetLine;

    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!param.point || !param.time || !containerRef.current) {
        setTooltip(null); return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = param.seriesData.get(lineSeries) as any;
      if (!d) { setTooltip(null); return; }

      // find matching raw data point
      const ts   = param.time as number;
      const raw  = (lineSeries as unknown as { _data?: RatioPoint[] })._data?.find(
        (r) => r.time === ts
      );

      setTooltip({
        time:      ts,
        pct:       d.value ?? 0,
        ethClose:  raw?.ethClose  ?? 0,
        btcClose:  raw?.btcClose  ?? 0,
        pricePair: raw?.pricePair ?? 0,
        x: param.point.x,
        y: param.point.y,
      });
    });

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width:  containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, []);

  // ── update data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lineRef.current || !peakLineRef.current || !chartRef.current || !series.length) return;

    const lineData = series.map((p) => ({
      time:  p.time as unknown as import("lightweight-charts").Time,
      value: p.pct,
    }));

    lineRef.current.setData(lineData);

    // Stash raw data on the series object for tooltip lookup
    (lineRef.current as unknown as { _data: RatioPoint[] })._data = series;

    // 100% flippening target line
    const first = series[0].time as unknown as import("lightweight-charts").Time;
    const last  = series[series.length - 1].time as unknown as import("lightweight-charts").Time;
    peakLineRef.current.setData([
      { time: first, value: 100 },
      { time: last,  value: 100 },
    ]);

    chartRef.current.timeScale().fitContent();
  }, [series]);

  const changeRange = useCallback((r: TimeRange) => setRange(r), []);

  const current = series[series.length - 1];

  return (
    <div className="rounded-2xl border border-surface-4/50 bg-surface-1 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-4/40">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-ink-4" />
          <div>
            <h3 className="text-sm font-semibold text-white">ETH/BTC Market-Cap Ratio</h3>
            <p className="text-xs text-ink-5">100% = Flippening achieved · Coinbase data</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {current && (
            <div className="hidden md:flex items-center gap-4 text-xs">
              <span className="text-ink-5">
                Now <span className="text-white font-mono">{current.pct.toFixed(2)}%</span>
              </span>
              <span className="text-ink-5">
                ATH <span className="text-white font-mono">{(peak * 100).toFixed(2)}%</span>
              </span>
              <span className="text-ink-5">
                Remaining <span className="text-white font-mono">{(100 - current.pct).toFixed(1)}%</span>
              </span>
            </div>
          )}
          <button onClick={refetch} disabled={loading}
            className="p-2 rounded-lg border border-surface-4/50 text-ink-5 hover:text-white hover:border-surface-6 transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Range picker */}
      <div className="flex items-center gap-1 px-6 py-2.5 border-b border-surface-4/30">
        {FLIP_RANGES.map((r) => (
          <button key={r.label} onClick={() => changeRange(r.label)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              range === r.label
                ? "bg-white text-black"
                : "text-ink-4 hover:text-white hover:bg-surface-3"
            )}
          >
            {r.label}
          </button>
        ))}

        {/* Legend */}
        <div className="ml-auto flex items-center gap-4 text-[11px] text-ink-5">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-px bg-white opacity-80 inline-block" />
            ETH MC / BTC MC
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 border-t border-dashed border-white/25 inline-block" />
            100% target
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: "380px" }}>
        <div ref={containerRef} className="w-full h-full" />

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <p className="text-ink-4 text-sm">Fetching {range} ratio data…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">Failed to load flippening data</p>
              <button onClick={refetch} className="text-xs text-ink-4 hover:text-white underline underline-offset-2">Try again</button>
            </div>
          </div>
        )}

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.08 }}
              className="absolute pointer-events-none z-10 bg-surface-2/95 backdrop-blur-sm border border-surface-5 rounded-xl p-3 shadow-card text-xs"
              style={{
                left: tooltip.x > (containerRef.current?.clientWidth || 600) / 2
                  ? tooltip.x - 200 : tooltip.x + 16,
                top: Math.max(8, tooltip.y - 90),
              }}
            >
              <p className="text-ink-5 mb-2 font-mono">{formatDate(tooltip.time)}</p>
              <div className="grid grid-cols-2 gap-x-5 gap-y-1">
                <span className="text-ink-5">Ratio</span>
                <span className="text-white font-mono font-semibold">{tooltip.pct.toFixed(3)}%</span>
                <span className="text-ink-5">ETH price</span>
                <span className="text-white font-mono">{formatCurrency(tooltip.ethClose)}</span>
                <span className="text-ink-5">BTC price</span>
                <span className="text-white font-mono">{formatCurrency(tooltip.btcClose)}</span>
                <span className="text-ink-5">ETH/BTC</span>
                <span className="text-white font-mono">{tooltip.pricePair.toFixed(6)}</span>
                <span className="text-ink-5">To flip</span>
                <span className={cn(
                  "font-mono",
                  tooltip.pct >= 100 ? "text-green-400" : "text-ink-3"
                )}>
                  {tooltip.pct >= 100 ? "✓ Done!" : `${(100 - tooltip.pct).toFixed(1)}% more`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-2 border-t border-surface-4/30 flex items-center justify-between text-[11px] text-ink-5">
        <span>Coinbase Exchange API · ETH-USD + BTC-USD</span>
        <span>{series.length.toLocaleString()} data points</span>
      </div>
    </div>
  );
}
