"use client";

import { getDb } from "@/db/database";
import { seedIfEmpty } from "@/db/seed";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, type ReactNode } from "react";

export function DbProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = getDb();
      await seedIfEmpty(db);
      if (!cancelled) setReady(true);
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col gap-4 p-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return <>{children}</>;
}
