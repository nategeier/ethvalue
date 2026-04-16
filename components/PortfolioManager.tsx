"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, Check, X, Wallet, TrendingUp, DollarSign, Euro } from "lucide-react";
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

  const handleCancel = () => {
    setEditLabel(entry.label);
    setEditAmount(entry.amount.toString());
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="group relative rounded-xl border border-eth-border/30 bg-eth-darker/50 p-4 hover:border-eth-purple/30 transition-all duration-300"
    >
      {/* Gradient border glow on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(98,126,234,0.05), transparent)" }}
      />

      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="flex-1 bg-eth-dark border border-eth-border/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-eth-purple/50 transition-colors"
            placeholder="Label (e.g. Hardware Wallet)"
            autoFocus
          />
          <input
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="w-28 bg-eth-dark border border-eth-border/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-eth-purple/50 transition-colors"
            placeholder="ETH amount"
            type="number"
            step="0.001"
            min="0"
          />
          <button onClick={handleSave} className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCancel} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white truncate">{entry.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-eth-purple/10 border border-eth-purple/20 text-eth-lavender font-mono">
                {entry.amount % 1 === 0 ? entry.amount.toFixed(0) : entry.amount.toFixed(4)} ETH
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-400 font-mono font-medium">{formatCurrency(usdValue, "USD")}</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 font-mono">{formatCurrency(eurValue, "EUR")}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-eth-purple hover:bg-eth-purple/10 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => removeEntry(entry.id)}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
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

  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const ethPrice = price?.usd || 0;
  const eurPrice = price?.eur || 0;
  const total = totalEth();
  const totalUsd = total * ethPrice;
  const totalEur = total * eurPrice;

  const handleAdd = () => {
    const amount = parseFloat(newAmount);
    if (!isNaN(amount) && amount > 0 && newLabel.trim()) {
      addEntry(newLabel.trim() || "My Holdings", amount);
      setNewLabel("");
      setNewAmount("");
      setShowAdd(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setShowAdd(false);
  };

  return (
    <div className="rounded-2xl border border-eth-border/40 bg-eth-card/60 backdrop-blur-sm shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-eth-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-eth-purple/10 border border-eth-purple/20">
              <Wallet className="w-4 h-4 text-eth-purple" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Portfolio Manager</h2>
              <p className="text-xs text-slate-500">Track your ETH holdings in real-time</p>
            </div>
          </div>
          {entries.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Total value banner */}
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-b border-eth-border/20"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-eth-purple/10 via-transparent to-transparent">
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Total Portfolio Value
            </p>
            <div className="flex items-end gap-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-2xl font-bold text-white tabular-nums">
                    {priceLoading ? "—" : formatCurrency(totalUsd, "USD")}
                  </span>
                </div>
              </div>
              <div className="mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Euro className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-lg font-semibold text-slate-300 tabular-nums">
                    {priceLoading ? "—" : formatCurrency(totalEur, "EUR")}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {total.toFixed(4)} ETH total
              {price && (
                <span className={cn(
                  "ml-2",
                  price.changePercent24h >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {formatPercent(price.changePercent24h)} 24h
                </span>
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Entries list */}
      <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {entries.map((entry) => (
            <EditableEntry
              key={entry.id}
              entry={entry}
              ethPrice={ethPrice}
              eurPrice={eurPrice}
            />
          ))}
        </AnimatePresence>

        {entries.length === 0 && !showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-12 h-12 rounded-full bg-eth-purple/10 border border-eth-purple/20 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-5 h-5 text-eth-purple/60" />
            </div>
            <p className="text-slate-500 text-sm">No holdings yet</p>
            <p className="text-slate-600 text-xs mt-1">Add your ETH to see your portfolio value</p>
          </motion.div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-eth-purple/30 bg-eth-purple/5 p-4 space-y-3">
                <p className="text-xs text-eth-lavender font-medium">New holding</p>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Label (e.g. "Ledger Wallet")'
                  className="w-full bg-eth-dark border border-eth-border/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-eth-purple/50 transition-colors"
                  autoFocus
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="0.00"
                      step="0.001"
                      min="0"
                      className="w-full bg-eth-dark border border-eth-border/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-eth-purple/50 transition-colors pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">ETH</span>
                  </div>
                  {newAmount && ethPrice && !isNaN(parseFloat(newAmount)) && (
                    <div className="flex items-center px-3 rounded-lg bg-eth-dark border border-eth-border/30 text-xs text-slate-400 whitespace-nowrap">
                      ≈ {formatCurrency(parseFloat(newAmount) * ethPrice, "USD")}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!newLabel.trim() || !newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0}
                    className="flex-1 py-2 rounded-lg bg-eth-purple text-white text-sm font-medium hover:bg-eth-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add holding
                  </button>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 rounded-lg border border-eth-border/40 text-slate-400 hover:text-white text-sm transition-colors"
                  >
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
        <div className="px-6 pb-5">
          <motion.button
            onClick={() => setShowAdd(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-eth-border/40 text-slate-500 hover:text-eth-purple hover:border-eth-purple/40 hover:bg-eth-purple/5 transition-all duration-200 text-sm group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Add ETH holding
          </motion.button>
        </div>
      )}
    </div>
  );
}
