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

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(148, 163, 184, 0.9)",
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(98, 126, 234, 0.06)" },
        horzLines: { color: "rgba(98, 126, 234, 0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(98, 126, 234, 0.4)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#1E1E4A",
        },
        horzLine: {
          color: "rgba(98, 126, 234, 0.4)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#1E1E4A",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(98, 126, 234, 0.15)",
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: "rgba(98, 126, 234, 0.15)",
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

    // Candlestick series (v4 API)
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00FF88",
      downColor: "#FF3B30",
      borderUpColor: "#00FF88",
      borderDownColor: "#FF3B30",
      wickUpColor: "rgba(0, 255, 136, 0.6)",
      wickDownColor: "rgba(255, 59, 48, 0.6)",
    });

    // Volume series (v4 API)
    const volumeSeries = chart.addHistogramSeries({
      color: "#627EEA",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Crosshair tooltip
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

  // Update data when candles change
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
        ? "rgba(0, 255, 136, 0.25)"
        : "rgba(255, 59, 48, 0.25)",
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setSelectedRange(range);
  }, []);

  const allTimeHigh = candles.reduce((max, c) => Math.max(max, c.high), 0);
  const allTimeLow = candles.reduce((min, c) => Math.min(min === 0 ? Infinity : min, c.low), 0);
  const firstClose = candles[0]?.close || 0;
  const lastClose = candles[candles.length - 1]?.close || 0;
  const totalChange = firstClose ? ((lastClose - firstClose) / firstClose) * 100 : 0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-eth-border/40 bg-eth-card/60 backdrop-blur-sm shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-eth-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-eth-purple/10 border border-eth-purple/20">
            <BarChart2 className="w-4 h-4 text-eth-purple" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">ETH / USD</h3>
            <p className="text-xs text-slate-500">Coinbase Exchange • OHLCV Candlestick</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {candles.length > 0 && (
            <div className="hidden md:flex items-center gap-4 mr-4 text-xs">
              <span className="text-slate-500">
                ATH: <span className="text-green-400">{formatCurrency(allTimeHigh)}</span>
              </span>
              <span className="text-slate-500">
                ATL: <span className="text-red-400">{formatCurrency(allTimeLow)}</span>
              </span>
              <span className={cn(
                "flex items-center gap-1",
                totalChange >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {totalChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {totalChange >= 0 ? "+" : ""}{totalChange.toFixed(0)}% period return
              </span>
            </div>
          )}

          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 rounded-lg border border-eth-border/40 text-slate-400 hover:text-white hover:border-eth-purple/40 transition-all"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-eth-border/20">
        {TIME_RANGES.map((range) => (
          <button
            key={range.label}
            onClick={() => handleRangeChange(range.label)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              selectedRange === range.label
                ? "bg-eth-purple text-white"
                : "text-slate-400 hover:text-white hover:bg-eth-border/20"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="relative" style={{ height: "480px" }}>
        <div ref={chartContainerRef} className="w-full h-full" />

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-eth-darker/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-t-eth-purple border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <p className="text-slate-400 text-sm">Fetching {selectedRange} data...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-2">Failed to load chart data</p>
              <button onClick={refetch} className="text-sm text-eth-purple hover:text-eth-lavender transition-colors">
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Crosshair tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute pointer-events-none z-10 bg-eth-card/95 backdrop-blur-sm border border-eth-border/50 rounded-xl p-3 shadow-card text-xs"
              style={{
                left: tooltip.x > (chartContainerRef.current?.clientWidth || 500) / 2
                  ? tooltip.x - 185
                  : tooltip.x + 16,
                top: Math.max(8, tooltip.y - 80),
              }}
            >
              <p className="text-slate-400 mb-2 font-mono">{formatDate(tooltip.time)}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-slate-500">O</span>
                <span className="text-white font-mono">{formatCurrency(tooltip.open)}</span>
                <span className="text-slate-500">H</span>
                <span className="text-green-400 font-mono">{formatCurrency(tooltip.high)}</span>
                <span className="text-slate-500">L</span>
                <span className="text-red-400 font-mono">{formatCurrency(tooltip.low)}</span>
                <span className="text-slate-500">C</span>
                <span className={cn(
                  "font-mono font-semibold",
                  tooltip.close >= tooltip.open ? "text-green-400" : "text-red-400"
                )}>
                  {formatCurrency(tooltip.close)}
                </span>
                <span className="text-slate-500">Vol</span>
                <span className="text-slate-300 font-mono">{tooltip.volume.toFixed(0)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-2 border-t border-eth-border/20 flex items-center justify-between text-xs text-slate-600">
        <span>Data source: Coinbase Exchange API</span>
        <span>{candles.length.toLocaleString()} candles loaded</span>
      </div>
    </div>
  );
}
