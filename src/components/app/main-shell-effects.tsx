"use client";

import { useTransactionSheetStore } from "@/store/transaction-sheet-store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function MainShellEffects() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openCreate = useTransactionSheetStore((s) => s.openCreate);

  useEffect(() => {
    const action = searchParams.get("action");
    if (!action) return;
    if (action === "income") openCreate("INCOME");
    if (action === "expense") openCreate("EXPENSE");
    if (action === "investment") openCreate("INVESTMENT");
    router.replace(pathname);
  }, [openCreate, pathname, router, searchParams]);

  return null;
}
