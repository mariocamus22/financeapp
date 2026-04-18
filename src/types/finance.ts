export type PlatformKind = "LIQUIDITY" | "INVESTMENT";

export type TransactionType = "INCOME" | "EXPENSE" | "INVESTMENT";

export type GoalType = "PATRIMONY" | "INVESTMENT" | "ASSET";

export type YearMonth = { year: number; month: number };

export type PlatformRow = {
  id: string;
  name: string;
  type: PlatformKind;
  color: string;
  icon: string;
  sortOrder: number;
  active: boolean;
};

export type AssetTypeRow = {
  id: string;
  name: string;
  monthlyTargetCents: number;
  color: string;
  icon: string;
  sortOrder: number;
  active: boolean;
};

export type IncomeTypeRow = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type ExpenseTypeRow = {
  id: string;
  name: string;
  monthlyBudgetCents: number;
  color: string;
  icon: string;
  sortOrder: number;
  active: boolean;
};

export type TransactionRow = {
  id: string;
  date: string;
  month: number;
  year: number;
  type: TransactionType;
  amountCents: number;
  description: string;
  platformId: string;
  categoryId: string;
  unitPriceCents: number | null;
  createdAt: string;
  updatedAt: string;
};

export type MonthlySnapshotRow = {
  id: string;
  month: number;
  year: number;
  totalIncomeCents: number;
  totalExpensesCents: number;
  totalInvestedCents: number;
  totalLiquidityCents: number;
  totalInvestmentValueCents: number;
  patrimonioTotalCents: number;
  liquidityByPlatform: Record<string, number>;
  investmentValueByAsset: Record<string, number>;
  investmentCapitalByAsset: Record<string, number>;
  closedAt: string;
};

export type GoalRow = {
  id: string;
  name: string;
  targetAmountCents: number;
  targetYear: number;
  type: GoalType;
  assetTypeId: string | null;
  sortOrder: number;
  active: boolean;
};

export type SettingsRow = {
  id: "default";
  emergencyFundTargetCents: number;
  currentYear: number;
  previousCapitalByAsset: Record<string, number>;
};

export type ExportBundleV1 = {
  version: 1;
  exportedAt: string;
  platforms: PlatformRow[];
  assetTypes: AssetTypeRow[];
  incomeTypes: IncomeTypeRow[];
  expenseTypes: ExpenseTypeRow[];
  transactions: TransactionRow[];
  monthlySnapshots: MonthlySnapshotRow[];
  goals: GoalRow[];
  settings: SettingsRow;
};
