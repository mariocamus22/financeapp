"use client";

import { Button } from "@/components/ui/button";
import { useTransactionSheetStore } from "@/store/transaction-sheet-store";
import { Plus } from "lucide-react";

export function FabAdd() {
  const openCreate = useTransactionSheetStore((s) => s.openCreate);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center">
      <Button
        type="button"
        size="lg"
        className="pointer-events-auto h-14 w-14 rounded-2xl shadow-lg shadow-primary/25"
        onClick={() => openCreate("EXPENSE")}
        aria-label="Añadir movimiento"
      >
        <Plus className="size-7" />
      </Button>
    </div>
  );
}
