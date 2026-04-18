import { BottomNav } from "@/components/app/bottom-nav";
import { FabAdd } from "@/components/app/fab-add";
import { MainShellEffects } from "@/components/app/main-shell-effects";
import { AddTransactionSheet } from "@/components/forms/add-transaction-sheet";
import { Suspense, type ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-8">{children}</main>
      <BottomNav />
      <FabAdd />
      <AddTransactionSheet />
      <Suspense fallback={null}>
        <MainShellEffects />
      </Suspense>
    </div>
  );
}
