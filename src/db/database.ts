import Dexie, { type Table } from "dexie";
import type {
  AssetTypeRow,
  ExpenseTypeRow,
  GoalRow,
  IncomeTypeRow,
  MonthlySnapshotRow,
  PlatformRow,
  SettingsRow,
  TransactionRow,
} from "@/types/finance";

export class FinanceDatabase extends Dexie {
  platforms!: Table<PlatformRow, string>;
  assetTypes!: Table<AssetTypeRow, string>;
  incomeTypes!: Table<IncomeTypeRow, string>;
  expenseTypes!: Table<ExpenseTypeRow, string>;
  transactions!: Table<TransactionRow, string>;
  monthlySnapshots!: Table<MonthlySnapshotRow, string>;
  goals!: Table<GoalRow, string>;
  settings!: Table<SettingsRow, "default">;

  constructor() {
    super("finance-pwa-db");
    this.version(1).stores({
      platforms: "id, type, sortOrder, active",
      assetTypes: "id, sortOrder, active",
      incomeTypes: "id, sortOrder, active",
      expenseTypes: "id, sortOrder, active",
      transactions: "id, year, month, type, platformId, categoryId, date",
      monthlySnapshots: "id, year, month",
      goals: "id, sortOrder, active",
      settings: "id",
    });
  }
}

let _db: FinanceDatabase | null = null;

export function getDb(): FinanceDatabase {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB solo está disponible en el cliente");
  }
  if (!_db) {
    _db = new FinanceDatabase();
  }
  return _db;
}
