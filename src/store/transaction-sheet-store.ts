"use client";

import type { TransactionType } from "@/types/finance";
import { create } from "zustand";

type State = {
  open: boolean;
  mode: "create" | "edit";
  editId: string | null;
  defaultType: TransactionType;
  openCreate: (type?: TransactionType) => void;
  openEdit: (id: string) => void;
  close: () => void;
};

export const useTransactionSheetStore = create<State>((set) => ({
  open: false,
  mode: "create",
  editId: null,
  defaultType: "EXPENSE",
  openCreate: (type) =>
    set({
      open: true,
      mode: "create",
      editId: null,
      defaultType: type ?? "EXPENSE",
    }),
  openEdit: (id) =>
    set({
      open: true,
      mode: "edit",
      editId: id,
    }),
  close: () =>
    set({
      open: false,
      mode: "create",
      editId: null,
    }),
}));
