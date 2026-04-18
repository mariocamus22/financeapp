"use client";

import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";
import { DbProvider } from "./db-provider";
import { FinanceAuthProvider } from "./finance-auth-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <FinanceAuthProvider>
        <DbProvider>
          {children}
          <Toaster richColors position="top-center" />
        </DbProvider>
      </FinanceAuthProvider>
    </QueryProvider>
  );
}
