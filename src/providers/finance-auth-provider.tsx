"use client";

import { setSupabaseSession } from "@/data";
import { QK } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function FinanceAuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSupabaseSession(null, null);
      return;
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(supabase, session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(supabase, session?.user?.id ?? null);
      void qc.invalidateQueries({ queryKey: QK.bootstrap });
    });

    return () => subscription.unsubscribe();
  }, [qc]);

  return <>{children}</>;
}
