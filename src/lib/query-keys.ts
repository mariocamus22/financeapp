export const QK = {
  bootstrap: ["finance", "bootstrap"] as const,
  transactions: (filter?: unknown) => ["finance", "transactions", filter] as const,
};
