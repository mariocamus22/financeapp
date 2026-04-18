import { getDb } from "@/db/database";
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
} from "@/types/finance";
import type { FinanceRepository, TransactionFilter } from "./finance-repository";

function matchTransaction(row: TransactionRow, f?: TransactionFilter): boolean {
  if (!f) return true;
  if (f.year !== undefined && row.year !== f.year) return false;
  if (f.month !== undefined && row.month !== f.month) return false;
  if (f.type && f.type !== "ALL" && row.type !== f.type) return false;
  if (f.platformId && row.platformId !== f.platformId) return false;
  if (f.categoryId && row.categoryId !== f.categoryId) return false;
  if (f.minCents !== undefined && row.amountCents < f.minCents) return false;
  if (f.maxCents !== undefined && row.amountCents > f.maxCents) return false;
  return true;
}

export class LocalFinanceRepository implements FinanceRepository {
  private db() {
    return getDb();
  }

  async listPlatforms() {
    return this.db().platforms.orderBy("sortOrder").toArray();
  }

  async upsertPlatform(row: PlatformRow) {
    await this.db().platforms.put(row);
  }

  async deletePlatform(id: string) {
    await this.db().platforms.delete(id);
  }

  async listAssetTypes() {
    return this.db().assetTypes.orderBy("sortOrder").toArray();
  }

  async upsertAssetType(row: AssetTypeRow) {
    await this.db().assetTypes.put(row);
  }

  async deleteAssetType(id: string) {
    await this.db().assetTypes.delete(id);
  }

  async listIncomeTypes() {
    return this.db().incomeTypes.orderBy("sortOrder").toArray();
  }

  async upsertIncomeType(row: IncomeTypeRow) {
    await this.db().incomeTypes.put(row);
  }

  async deleteIncomeType(id: string) {
    await this.db().incomeTypes.delete(id);
  }

  async listExpenseTypes() {
    return this.db().expenseTypes.orderBy("sortOrder").toArray();
  }

  async upsertExpenseType(row: ExpenseTypeRow) {
    await this.db().expenseTypes.put(row);
  }

  async deleteExpenseType(id: string) {
    await this.db().expenseTypes.delete(id);
  }

  async listGoals() {
    return this.db().goals.orderBy("sortOrder").toArray();
  }

  async upsertGoal(row: GoalRow) {
    await this.db().goals.put(row);
  }

  async deleteGoal(id: string) {
    await this.db().goals.delete(id);
  }

  async getSettings() {
    return this.db().settings.get("default");
  }

  async upsertSettings(row: SettingsRow) {
    await this.db().settings.put(row);
  }

  async listTransactions(filter?: TransactionFilter) {
    const all = await this.db().transactions.toArray();
    const filtered = all.filter((t) => matchTransaction(t, filter));
    filtered.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return filtered;
  }

  async getTransaction(id: string) {
    return this.db().transactions.get(id);
  }

  async upsertTransaction(row: TransactionRow) {
    await this.db().transactions.put(row);
  }

  async deleteTransaction(id: string) {
    await this.db().transactions.delete(id);
  }

  async listSnapshots() {
    const rows = await this.db().monthlySnapshots.toArray();
    rows.sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month,
    );
    return rows;
  }

  async getSnapshot(year: number, month: number) {
    return this.db()
      .monthlySnapshots.where("year")
      .equals(year)
      .filter((s) => s.month === month)
      .first();
  }

  async upsertSnapshot(row: MonthlySnapshotRow) {
    await this.db().monthlySnapshots.put(row);
  }

  async deleteSnapshot(id: string) {
    await this.db().monthlySnapshots.delete(id);
  }

  async exportAll(): Promise<ExportBundleV1> {
    const db = this.db();
    const settings = await db.settings.get("default");
    if (!settings) {
      throw new Error("Settings no inicializados");
    }
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      platforms: await db.platforms.toArray(),
      assetTypes: await db.assetTypes.toArray(),
      incomeTypes: await db.incomeTypes.toArray(),
      expenseTypes: await db.expenseTypes.toArray(),
      transactions: await db.transactions.toArray(),
      monthlySnapshots: await db.monthlySnapshots.toArray(),
      goals: await db.goals.toArray(),
      settings,
    };
  }

  async importAll(bundle: ExportBundleV1): Promise<void> {
    if (bundle.version !== 1) throw new Error("Versión de export no soportada");
    const db = this.db();
    await db.transaction(
      "rw",
      [
        db.platforms,
        db.assetTypes,
        db.incomeTypes,
        db.expenseTypes,
        db.transactions,
        db.monthlySnapshots,
        db.goals,
        db.settings,
      ],
      async () => {
        await db.platforms.clear();
        await db.assetTypes.clear();
        await db.incomeTypes.clear();
        await db.expenseTypes.clear();
        await db.transactions.clear();
        await db.monthlySnapshots.clear();
        await db.goals.clear();
        await db.settings.clear();
        await db.platforms.bulkAdd(bundle.platforms);
        await db.assetTypes.bulkAdd(bundle.assetTypes);
        await db.incomeTypes.bulkAdd(bundle.incomeTypes);
        await db.expenseTypes.bulkAdd(bundle.expenseTypes);
        await db.transactions.bulkAdd(bundle.transactions);
        await db.monthlySnapshots.bulkAdd(bundle.monthlySnapshots);
        await db.goals.bulkAdd(bundle.goals);
        await db.settings.put(bundle.settings);
      },
    );
  }
}
