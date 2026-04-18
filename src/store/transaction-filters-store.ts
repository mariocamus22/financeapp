"use client";

import type { TransactionType } from "@/types/finance";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TransactionTab = "ALL" | TransactionType;

type State = {
  tab: TransactionTab;
  setTab: (t: TransactionTab) => void;
};

export const useTransactionFiltersStore = create(
  persist<State>(
    (set) => ({
      tab: "ALL",
      setTab: (tab) => set({ tab }),
    }),
    { name: "finance-tx-tab" },
  ),
);
