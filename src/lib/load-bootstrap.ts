import { getFinanceRepository } from "@/data";

export type BootstrapData = {
  platforms: Awaited<ReturnType<ReturnType<typeof getFinanceRepository>["listPlatforms"]>>;
  assetTypes: Awaited<ReturnType<ReturnType<typeof getFinanceRepository>["listAssetTypes"]>>;
  incomeTypes: Awaited<ReturnType<ReturnType<typeof getFinanceRepository>["listIncomeTypes"]>>;
  expenseTypes: Awaited<ReturnType<ReturnType<typeof getFinanceRepository>["listExpenseTypes"]>>;
  goals: Awaited<ReturnType<ReturnType<typeof getFinanceRepository>["listGoals"]>>;
  settings: NonNullable<
    Awaited<ReturnType<ReturnType<typeof getFinanceRepository>["getSettings"]>>
  >;
  snapshots: Awaited<ReturnType<ReturnType<typeof getFinanceRepository>["listSnapshots"]>>;
  transactions: Awaited<ReturnType<ReturnType<typeof getFinanceRepository>["listTransactions"]>>;
};

export async function loadBootstrap(): Promise<BootstrapData> {
  const repo = getFinanceRepository();
  const [
    platforms,
    assetTypes,
    incomeTypes,
    expenseTypes,
    goals,
    settings,
    snapshots,
    transactions,
  ] = await Promise.all([
    repo.listPlatforms(),
    repo.listAssetTypes(),
    repo.listIncomeTypes(),
    repo.listExpenseTypes(),
    repo.listGoals(),
    repo.getSettings(),
    repo.listSnapshots(),
    repo.listTransactions(),
  ]);
  if (!settings) {
    throw new Error("Settings no disponibles");
  }
  transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return {
    platforms,
    assetTypes,
    incomeTypes,
    expenseTypes,
    goals,
    settings,
    snapshots,
    transactions,
  };
}
