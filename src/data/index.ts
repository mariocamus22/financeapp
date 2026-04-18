import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinanceRepository } from "./finance-repository";
import { DelegatingFinanceRepository } from "./delegating-finance-repository";
import { LocalFinanceRepository } from "./local-finance-repository";

let delegating: DelegatingFinanceRepository | null = null;

function getDelegating(): DelegatingFinanceRepository {
  if (!delegating) {
    delegating = new DelegatingFinanceRepository(new LocalFinanceRepository());
  }
  return delegating;
}

export function getFinanceRepository(): FinanceRepository {
  return getDelegating();
}

/** Llamado desde el provider de auth al cambiar sesión Supabase. */
export function setSupabaseSession(
  client: SupabaseClient | null,
  userId: string | null,
): void {
  getDelegating().setRemote(client, userId);
}

export type { FinanceRepository, TransactionFilter } from "./finance-repository";
