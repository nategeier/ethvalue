"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
} from "lightweight-charts";
import { useCandles } from "@/hooks/useCandles";
import type { TimeRange } from "@/lib/types";
import { TIME_RANGES } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  x: number;
  y: number;
}

export default function CandlestickChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);

  const [selectedRange, setSelectedRange] = useState<TimeRange>("10Y");
  const { candles, loading, error, refetch } = useCandles(selectedRange);
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
        vertLine: {
          color: "rgba(255,255,255,0.2)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#1f1f1f",
        },
        horzLine: {
          color: "rgba(255,255,255,0.2)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#1f1f1f",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.1, bottom: 0.25 },
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

    const candleSeries = chart.addCandlestickSeries({
      upColor:        "#22c55e",
      downColor:      "#ef4444",
      borderUpColor:  "#22c55e",
      borderDownColor:"#ef4444",
      wickUpColor:    "rgba(34,197,94,0.5)",
      wickDownColor:  "rgba(239,68,68,0.5)",
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "rgba(255,255,255,0.15)",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!param.point || !param.time || !chartContainerRef.current) {
        setTooltip(null);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = param.seriesData.get(candleSeries) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const volumeData = param.seriesData.get(volumeSeries) as any;
      if (!data) { setTooltip(null); return; }

      setTooltip({
        time: param.time as number,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: volumeData?.value || 0,
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
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles.length) return;

    const candleData = candles.map((c) => ({
      time: c.time as unknown as import("lightweight-charts").Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = candles.map((c) => ({
      time: c.time as unknown as import("lightweight-charts").Time,
      value: c.volume,
      color: c.close >= c.open
        ? "rgba(34, 197, 94, 0.2)"
        : "rgba(239, 68, 68, 0.2)",
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setSelectedRange(range);
  }, []);

  const allTimeHigh = candles.reduce((max, c) => Math.max(max, c.high), 0);
  const allTimeLow  = candles.reduce((min, c) => Math.min(min === 0 ? Infinity : min, c.low), 0);
  const firstClose  = candles[0]?.close || 0;
  const lastClose   = candles[candles.length - 1]?.close || 0;
  const totalChange = firstClose ? ((lastClose - firstClose) / firstClose) * 100 : 0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-surface-4/50 bg-surface-1 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-4/40">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-4 h-4 text-ink-4" />
          <div>
            <h3 className="text-sm font-semibold text-white">ETH / USD</h3>
            <p className="text-xs text-ink-5">Coinbase Exchange · OHLCV</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {candles.length > 0 && (
            <div className="hidden md:flex items-center gap-4 text-xs">
              <span className="text-ink-5">
                ATH <span className="text-green-400 font-mono">{formatCurrency(allTimeHigh)}</span>
              </span>
              <span className="text-ink-5">
                ATL <span className="text-red-400 font-mono">{formatCurrency(allTimeLow)}</span>
              </span>
              <span className={cn(
                "flex items-center gap-1 font-mono",
                totalChange >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {totalChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {totalChange >= 0 ? "+" : ""}{totalChange.toFixed(0)}% period
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
      <div className="relative" style={{ height: "480px" }}>
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
              <p className="text-red-400 text-sm mb-2">Failed to load chart data</p>
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
                  ? tooltip.x - 185 : tooltip.x + 16,
                top: Math.max(8, tooltip.y - 80),
              }}
            >
              <p className="text-ink-5 mb-2 font-mono">{formatDate(tooltip.time)}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-ink-5">O</span>
                <span className="text-white font-mono">{formatCurrency(tooltip.open)}</span>
                <span className="text-ink-5">H</span>
                <span className="text-green-400 font-mono">{formatCurrency(tooltip.high)}</span>
                <span className="text-ink-5">L</span>
                <span className="text-red-400 font-mono">{formatCurrency(tooltip.low)}</span>
                <span className="text-ink-5">C</span>
                <span className={cn(
                  "font-mono font-semibold",
                  tooltip.close >= tooltip.open ? "text-green-400" : "text-red-400"
                )}>
                  {formatCurrency(tooltip.close)}
                </span>
                <span className="text-ink-5">Vol</span>
                <span className="text-ink-3 font-mono">{tooltip.volume.toFixed(0)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-2 border-t border-surface-4/30 flex items-center justify-between text-[11px] text-ink-5">
        <span>Coinbase Exchange API</span>
        <span>{candles.length.toLocaleString()} candles</span>
      </div>
    </div>
  );
}
