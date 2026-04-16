import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PortfolioEntry } from "@/lib/types";

interface PortfolioStore {
  entries: PortfolioEntry[];
  addEntry: (label: string, amount: number) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, label: string, amount: number) => void;
  clearAll: () => void;
  totalEth: () => number;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (label, amount) => {
        const entry: PortfolioEntry = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label,
          amount,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ entries: [...state.entries, entry] }));
      },

      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      updateEntry: (id, label, amount) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, label, amount } : e
          ),
        }));
      },

      clearAll: () => set({ entries: [] }),

      totalEth: () => {
        return get().entries.reduce((sum, e) => sum + e.amount, 0);
      },
    }),
    {
      name: "ethvalue-portfolio",
    }
  )
);
