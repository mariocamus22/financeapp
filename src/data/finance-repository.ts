import type {
  AssetTypeRow,
  ExpenseTypeRow,
  ExportBundleV1,
  GoalRow,
  IncomeTypeRow,
  MonthlySnapshotRow,
  PlatformRow,
  SettingsRow,
  TransactionRow,
  TransactionType,
} from "@/types/finance";

export type TransactionFilter = {
  year?: number;
  month?: number;
  type?: TransactionType | "ALL";
  platformId?: string;
  categoryId?: string;
  minCents?: number;
  maxCents?: number;
};

export interface FinanceRepository {
  listPlatforms(): Promise<PlatformRow[]>;
  upsertPlatform(row: PlatformRow): Promise<void>;
  deletePlatform(id: string): Promise<void>;

  listAssetTypes(): Promise<AssetTypeRow[]>;
  upsertAssetType(row: AssetTypeRow): Promise<void>;
  deleteAssetType(id: string): Promise<void>;

  listIncomeTypes(): Promise<IncomeTypeRow[]>;
  upsertIncomeType(row: IncomeTypeRow): Promise<void>;
  deleteIncomeType(id: string): Promise<void>;

  listExpenseTypes(): Promise<ExpenseTypeRow[]>;
  upsertExpenseType(row: ExpenseTypeRow): Promise<void>;
  deleteExpenseType(id: string): Promise<void>;

  listGoals(): Promise<GoalRow[]>;
  upsertGoal(row: GoalRow): Promise<void>;
  deleteGoal(id: string): Promise<void>;

  getSettings(): Promise<SettingsRow | undefined>;
  upsertSettings(row: SettingsRow): Promise<void>;

  listTransactions(filter?: TransactionFilter): Promise<TransactionRow[]>;
  getTransaction(id: string): Promise<TransactionRow | undefined>;
  upsertTransaction(row: TransactionRow): Promise<void>;
  deleteTransaction(id: string): Promise<void>;

  listSnapshots(): Promise<MonthlySnapshotRow[]>;
  getSnapshot(year: number, month: number): Promise<MonthlySnapshotRow | undefined>;
  upsertSnapshot(row: MonthlySnapshotRow): Promise<void>;
  deleteSnapshot(id: string): Promise<void>;

  exportAll(): Promise<ExportBundleV1>;
  importAll(bundle: ExportBundleV1): Promise<void>;
}
