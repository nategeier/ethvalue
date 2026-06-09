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
  type Time,
} from "lightweight-charts";
import { useValidatorQueue } from "@/hooks/useValidatorQueue";
import type { TimeRange } from "@/lib/types";
import { TIME_RANGES } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, RefreshCw, ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const ENTRY_LINE = "#22c55e";
const ENTRY_FILL_TOP = "rgba(34, 197, 94, 0.28)";
const ENTRY_FILL_BOT = "rgba(34, 197, 94, 0.02)";
const EXIT_LINE = "#ef4444";
const EXIT_FILL_TOP = "rgba(239, 68, 68, 0.26)";
const EXIT_FILL_BOT = "rgba(239, 68, 68, 0.02)";

function formatEth(n: number): string {
  const v = Math.abs(n);
  if (v >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

function formatWait(days: number): string {
  if (days < 1 / 24) return "<1h";
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 10) return `${days.toFixed(1)}d`;
  return `${Math.round(days)}d`;
}

interface TooltipData {
  time: number;
  entryQueue: number;
  exitQueue: number;
  x: number;
  y: number;
}

export default function ValidatorQueueChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entrySeriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exitSeriesRef = useRef<ISeriesApi<any> | null>(null);

  const [selectedRange, setSelectedRange] = useState<TimeRange>("1Y");
  const { points, stats, loading, error, refetch } = useValidatorQueue(selectedRange);
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
        scaleMargins: { top: 0.12, bottom: 0.08 },
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

    const entrySeries = chart.addAreaSeries({
      lineColor: ENTRY_LINE,
      topColor: ENTRY_FILL_TOP,
      bottomColor: ENTRY_FILL_BOT,
      lineWidth: 2,
      priceFormat: { type: "volume" },
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const exitSeries = chart.addAreaSeries({
      lineColor: EXIT_LINE,
      topColor: EXIT_FILL_TOP,
      bottomColor: EXIT_FILL_BOT,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceFormat: { type: "volume" },
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    entrySeriesRef.current = entrySeries;
    exitSeriesRef.current = exitSeries;

    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!param.point || !param.time || !chartContainerRef.current) {
        setTooltip(null);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = param.seriesData.get(entrySeries) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const x = param.seriesData.get(exitSeries) as any;
      if (!e && !x) { setTooltip(null); return; }
      setTooltip({
        time: param.time as number,
        entryQueue: e?.value ?? 0,
        exitQueue: x?.value ?? 0,
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
    if (!entrySeriesRef.current || !exitSeriesRef.current || !points.length) return;
    entrySeriesRef.current.setData(
      points.map((p) => ({ time: p.time as unknown as Time, value: p.entryQueue }))
    );
    exitSeriesRef.current.setData(
      points.map((p) => ({ time: p.time as unknown as Time, value: p.exitQueue }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setSelectedRange(range);
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-surface-4/50 bg-surface-1 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-4/40">
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-ink-4" />
          <div>
            <h3 className="text-sm font-semibold text-white">Validator Queue</h3>
            <p className="text-xs text-ink-5">Beacon chain · ETH waiting to enter vs exit</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stats && (
            <div className="hidden md:flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-ink-5">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                Entry <span className="text-green-400 font-mono">{formatEth(stats.currentEntryQueue)}</span>
              </span>
              <span className="flex items-center gap-1 text-ink-5">
                <ArrowDownRight className="w-3 h-3 text-red-400" />
                Exit <span className="text-red-400 font-mono">{formatEth(stats.currentExitQueue)}</span>
              </span>
              {stats.stakedPercent != null && (
                <span className="text-ink-5">
                  Staked <span className="text-ink-2 font-mono">{stats.stakedPercent.toFixed(1)}%</span>
                </span>
              )}
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

      {/* Wait times */}
      <div className="grid grid-cols-2 gap-px bg-surface-4/30 border-b border-surface-4/30">
        <div className="flex items-center gap-3 px-6 py-3 bg-surface-1">
          <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div>
            <p className="text-[11px] text-ink-5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Entry wait
            </p>
            <p className="text-base font-bold text-white tabular-nums">
              {stats ? formatWait(stats.currentEntryWaitDays) : "—"}
            </p>
          </div>
          {stats && (
            <span className="ml-auto text-[11px] text-ink-5 font-mono">
              avg {formatWait(stats.avgEntryWaitDays)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-surface-1">
          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <p className="text-[11px] text-ink-5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Exit wait
            </p>
            <p className="text-base font-bold text-white tabular-nums">
              {stats ? formatWait(stats.currentExitWaitDays) : "—"}
            </p>
          </div>
          {stats && (
            <span className="ml-auto text-[11px] text-ink-5 font-mono">
              avg {formatWait(stats.avgExitWaitDays)}
            </span>
          )}
        </div>
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
              <p className="text-red-400 text-sm mb-2">Failed to load validator queue data</p>
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
                  ? tooltip.x - 195 : tooltip.x + 16,
                top: Math.max(8, tooltip.y - 60),
              }}
            >
              <p className="text-ink-5 mb-2 font-mono">{formatDate(tooltip.time)}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-ink-5">Entry queue</span>
                <span className="text-green-400 font-mono">{Math.round(tooltip.entryQueue).toLocaleString()} ETH</span>
                <span className="text-ink-5">Exit queue</span>
                <span className="text-red-400 font-mono">{Math.round(tooltip.exitQueue).toLocaleString()} ETH</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-2 border-t border-surface-4/30 flex items-center justify-between text-[11px] text-ink-5">
        <span>ethvalue DB · validatorqueue.com</span>
        <span>{points.length.toLocaleString()} days</span>
      </div>
    </div>
  );
}
