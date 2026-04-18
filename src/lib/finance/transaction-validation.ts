import type { TransactionRow, TransactionType } from "@/types/finance";

export type CategoryBuckets = {
  incomeIds: Set<string>;
  expenseIds: Set<string>;
  assetIds: Set<string>;
};

export function assertCategoryMatchesType(
  type: TransactionType,
  categoryId: string,
  buckets: CategoryBuckets,
): void {
  if (type === "INCOME" && !buckets.incomeIds.has(categoryId)) {
    throw new Error("La categoría no es un tipo de ingreso válido");
  }
  if (type === "EXPENSE" && !buckets.expenseIds.has(categoryId)) {
    throw new Error("La categoría no es un tipo de gasto válido");
  }
  if (type === "INVESTMENT" && !buckets.assetIds.has(categoryId)) {
    throw new Error("La categoría no es un tipo de activo válido");
  }
}

export function normalizeTransactionRow(
  partial: Omit<TransactionRow, "createdAt" | "updatedAt"> &
    Partial<Pick<TransactionRow, "createdAt" | "updatedAt">>,
): TransactionRow {
  const d = new Date(partial.date);
  const now = new Date().toISOString();
  return {
    ...partial,
    year: partial.year || d.getFullYear(),
    month: partial.month || d.getMonth() + 1,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}
