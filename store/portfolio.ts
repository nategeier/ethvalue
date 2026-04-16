import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PortfolioEntry } from "@/lib/types";

interface PortfolioStore {
  entries: PortfolioEntry[];
  addEntry:    (label: string, amount: number) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, label: string, amount: number) => void;
  clearAll:    () => void;
  totalEth:    () => number;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (label, amount) => {
        const entry: PortfolioEntry = {
          id:        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          label,
          amount,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ entries: [...s.entries, entry] }));
      },

      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      updateEntry: (id, label, amount) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, label, amount } : e
          ),
        })),

      clearAll: () => set({ entries: [] }),

      totalEth: () => get().entries.reduce((sum, e) => sum + e.amount, 0),
    }),
    {
      // Unique key → scoped to this app, not shared across other sites
      name:    "ethvalue-v1-portfolio",
      storage: createJSONStorage(() => localStorage),
      // Only persist entries; derived state (totalEth fn) is excluded automatically
      partialize: (s) => ({ entries: s.entries }),
      // Version for future schema migrations
      version: 1,
      migrate: (persisted, version) => {
        // v0 → v1: no-op (first release), extend here for future changes
        if (version === 0) return persisted as PortfolioStore;
        return persisted as PortfolioStore;
      },
    }
  )
);
