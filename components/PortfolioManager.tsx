"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, Check, X, Wallet, TrendingUp, TrendingDown, DollarSign, Euro } from "lucide-react";
import { usePortfolioStore } from "@/store/portfolio";
import { useEthPrice } from "@/hooks/useEthPrice";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { PortfolioEntry } from "@/lib/types";

function EditableEntry({
  entry,
  ethPrice,
  eurPrice,
}: {
  entry: PortfolioEntry;
  ethPrice: number;
  eurPrice: number;
}) {
  const { removeEntry, updateEntry } = usePortfolioStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(entry.label);
  const [editAmount, setEditAmount] = useState(entry.amount.toString());

  const usdValue = entry.amount * ethPrice;
  const eurValue = entry.amount * eurPrice;

  const handleSave = () => {
    const amount = parseFloat(editAmount);
    if (!isNaN(amount) && amount > 0 && editLabel.trim()) {
      updateEntry(entry.id, editLabel.trim(), amount);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="group rounded-xl border border-surface-4/50 bg-surface-2/60 p-4 hover:border-surface-5 transition-all duration-200"
    >
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="flex-1 bg-surface-1 border border-surface-5 rounded-lg px-3 py-1.5 text-sm text-white placeholder-ink-5 focus:outline-none focus:border-surface-6 transition-colors"
            autoFocus
          />
          <input
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="w-24 bg-surface-1 border border-surface-5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-surface-6 transition-colors"
            type="number" step="0.001" min="0"
          />
          <button onClick={handleSave}
            className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setEditLabel(entry.label); setEditAmount(entry.amount.toString()); setIsEditing(false); }}
            className="p-1.5 rounded-lg bg-surface-3 border border-surface-5 text-ink-4 hover:text-white transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white truncate">{entry.label}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-3 border border-surface-5 text-ink-4 font-mono flex-shrink-0">
                {entry.amount % 1 === 0 ? entry.amount : entry.amount.toFixed(4)} ETH
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <span className="text-white font-mono tabular-nums">{formatCurrency(usdValue)}</span>
              <span className="text-ink-5">·</span>
              <span className="text-ink-3 font-mono tabular-nums">{formatCurrency(eurValue, "EUR")}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg text-ink-5 hover:text-white hover:bg-surface-3 transition-all">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => removeEntry(entry.id)}
              className="p-2 rounded-lg text-ink-5 hover:text-red-400 hover:bg-red-500/8 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function PortfolioManager() {
  const { entries, addEntry, clearAll, totalEth } = usePortfolioStore();
  const { price, loading: priceLoading } = useEthPrice();

  const [newLabel, setNewLabel]   = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [showAdd, setShowAdd]     = useState(false);

  const ethPrice = price?.usd ?? 0;
  const eurPrice = price?.eur ?? 0;
  const total    = totalEth();
  const totalUsd = total * ethPrice;
  const totalEur = total * eurPrice;

  const handleAdd = () => {
    const amount = parseFloat(newAmount);
    if (!isNaN(amount) && amount > 0 && newLabel.trim()) {
      addEntry(newLabel.trim(), amount);
      setNewLabel("");
      setNewAmount("");
      setShowAdd(false);
    }
  };

  return (
    <div className="rounded-2xl border border-surface-4/50 bg-surface-1 shadow-card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-4/40 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Wallet className="w-4 h-4 text-ink-4" />
          <div>
            <h2 className="text-sm font-semibold text-white">Portfolio</h2>
            <p className="text-[11px] text-ink-5 mt-0.5">Stored locally · private to you</p>
          </div>
        </div>
        {entries.length > 0 && (
          <button onClick={clearAll}
            className="text-xs text-ink-5 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/8">
            Clear
          </button>
        )}
      </div>

      {/* Total */}
      <AnimatePresence>
        {total > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-surface-4/30 overflow-hidden flex-shrink-0"
          >
            <div className="px-5 py-4">
              <p className="text-[11px] text-ink-5 mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Total Portfolio Value
              </p>
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-white" />
                  <span className="text-2xl font-black text-white tabular-nums">
                    {priceLoading ? "—" : formatCurrency(totalUsd)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Euro className="w-3.5 h-3.5 text-ink-4" />
                <span className="text-sm font-medium text-ink-3 tabular-nums">
                  {priceLoading ? "—" : formatCurrency(totalEur, "EUR")}
                </span>
                {price && (
                  <span className={cn(
                    "text-xs font-mono ml-1",
                    price.changePercent24h >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {formatPercent(price.changePercent24h)} 24h
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-5 mt-1 font-mono">{total.toFixed(4)} ETH total</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 min-h-0">
        <AnimatePresence mode="popLayout">
          {entries.map((entry) => (
            <EditableEntry key={entry.id} entry={entry} ethPrice={ethPrice} eurPrice={eurPrice} />
          ))}
        </AnimatePresence>

        {entries.length === 0 && !showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
            <div className="w-10 h-10 rounded-full bg-surface-3 border border-surface-5 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-4 h-4 text-ink-5" />
            </div>
            <p className="text-ink-4 text-sm">No holdings yet</p>
            <p className="text-ink-5 text-xs mt-0.5">Add your ETH to see live value</p>
          </motion.div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-surface-5 bg-surface-2 p-4 space-y-3">
                <p className="text-xs text-ink-3 font-medium">New holding</p>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
                  placeholder='Label — e.g. "Ledger Wallet"'
                  className="w-full bg-surface-1 border border-surface-4 rounded-lg px-3 py-2.5 text-sm text-white placeholder-ink-5 focus:outline-none focus:border-surface-6 transition-colors"
                  autoFocus
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
                      placeholder="0.00"
                      step="0.001" min="0"
                      className="w-full bg-surface-1 border border-surface-4 rounded-lg px-3 py-2.5 text-sm text-white placeholder-ink-5 focus:outline-none focus:border-surface-6 transition-colors pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-5 font-mono">ETH</span>
                  </div>
                  {newAmount && ethPrice && !isNaN(parseFloat(newAmount)) && (
                    <div className="flex items-center px-3 rounded-lg bg-surface-1 border border-surface-4 text-xs text-ink-4 font-mono whitespace-nowrap">
                      ≈ {formatCurrency(parseFloat(newAmount) * ethPrice)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!newLabel.trim() || !newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0}
                    className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-ink-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Add holding
                  </button>
                  <button onClick={() => setShowAdd(false)}
                    className="px-4 py-2.5 rounded-lg border border-surface-5 text-ink-4 hover:text-white text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add button */}
      {!showAdd && (
        <div className="px-5 pb-5 pt-2 flex-shrink-0">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-surface-5 text-ink-5 hover:text-white hover:border-surface-6 hover:bg-surface-2 transition-all duration-200 text-sm group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Add holding
          </button>
        </div>
      )}
    </div>
  );
}
