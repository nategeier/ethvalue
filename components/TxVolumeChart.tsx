"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import { useTxVolume } from "@/hooks/useTxVolume";
import type { TimeRange } from "@/lib/types";
import { TIME_RANGES } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

interface TooltipData {
  time: number;
  value: number;
  x: number;
  y: number;
}

export default function TxVolumeChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  const [selectedRange, setSelectedRange] = useState<TimeRange>("1Y");
  const { points, loading, error, refetch } = useTxVolume(selectedRange);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(115, 115, 115, 0.9)",
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.2)", width: 1, style: 3, labelBackgroundColor: "#1f1f1f" },
        horzLine: { color: "rgba(255,255,255,0.2)", width: 1, style: 3, labelBackgroundColor: "#1f1f1f" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 6,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const series = chart.addHistogramSeries({
      color: "rgba(139, 92, 246, 0.55)",
      priceFormat: { type: "volume" },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!param.point || !param.time || !chartContainerRef.current) {
        setTooltip(null);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = param.seriesData.get(series) as any;
      if (!data) { setTooltip(null); return; }
      setTooltip({
        time: param.time as number,
        value: data.value,
        x: param.point.x,
        y: param.point.y,
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !points.length) return;
    seriesRef.current.setData(
      points.map((p) => ({
        time: p.time as unknown as Time,
        value: p.value,
        color: "rgba(139, 92, 246, 0.55)",
      }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setSelectedRange(range);
  }, []);

  const peak = points.reduce((m, p) => Math.max(m, p.value), 0);
  const avg = points.length
    ? points.reduce((s, p) => s + p.value, 0) / points.length
    : 0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-surface-4/50 bg-surface-1 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-4/40">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-ink-4" />
          <div>
            <h3 className="text-sm font-semibold text-white">Transaction Volume</h3>
            <p className="text-xs text-ink-5">Ethereum mainnet · daily tx count</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {points.length > 0 && (
            <div className="hidden md:flex items-center gap-4 text-xs">
              <span className="text-ink-5">
                Peak <span className="text-violet-300 font-mono">{formatCompact(peak)}</span>
              </span>
              <span className="text-ink-5">
                Avg <span className="text-ink-2 font-mono">{formatCompact(avg)}</span>
              </span>
            </div>
          )}
          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 rounded-lg border border-surface-4/50 text-ink-5 hover:text-white hover:border-surface-6 transition-all"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-1 px-6 py-2.5 border-b border-surface-4/30">
        {TIME_RANGES.map((range) => (
          <button
            key={range.label}
            onClick={() => handleRangeChange(range.label)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
              selectedRange === range.label
                ? "bg-white text-black"
                : "text-ink-4 hover:text-white hover:bg-surface-3"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: "320px" }}>
        <div ref={chartContainerRef} className="w-full h-full" />

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <p className="text-ink-4 text-sm">Loading {selectedRange} data…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">Failed to load transaction volume</p>
              <button onClick={refetch} className="text-xs text-ink-4 hover:text-white transition-colors underline underline-offset-2">
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.08 }}
              className="absolute pointer-events-none z-10 bg-surface-2/95 backdrop-blur-sm border border-surface-5 rounded-xl p-3 shadow-card text-xs"
              style={{
                left: tooltip.x > (chartContainerRef.current?.clientWidth || 500) / 2
                  ? tooltip.x - 165 : tooltip.x + 16,
                top: Math.max(8, tooltip.y - 60),
              }}
            >
              <p className="text-ink-5 mb-2 font-mono">{formatDate(tooltip.time)}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-ink-5">Txns</span>
                <span className="text-violet-300 font-mono font-semibold">{tooltip.value.toLocaleString()}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-2 border-t border-surface-4/30 flex items-center justify-between text-[11px] text-ink-5">
        <span>ethvalue DB</span>
        <span>{points.length.toLocaleString()} days</span>
      </div>
    </div>
  );
}
