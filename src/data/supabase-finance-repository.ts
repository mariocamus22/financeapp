import type { SupabaseClient } from "@supabase/supabase-js";
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
import type { FinanceRepository, TransactionFilter } from "./finance-repository";

const T = {
  platforms: "finance_platforms",
  assets: "finance_asset_types",
  income: "finance_income_types",
  expense: "finance_expense_types",
  goals: "finance_goals",
  settings: "finance_settings",
  snapshots: "finance_monthly_snapshots",
  transactions: "finance_transactions",
} as const;

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

type DbPlatform = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

function fromPlatform(r: DbPlatform): PlatformRow {
  return {
    id: r.id,
    name: r.name,
    type: r.type as PlatformRow["type"],
    color: r.color,
    icon: r.icon,
    sortOrder: r.sort_order,
    active: r.active,
  };
}

function toPlatform(r: PlatformRow, userId: string): DbPlatform {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    type: r.type,
    color: r.color,
    icon: r.icon,
    sort_order: r.sortOrder,
    active: r.active,
  };
}

type DbAsset = {
  id: string;
  user_id: string;
  name: string;
  monthly_target_cents: number;
  color: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

function fromAsset(r: DbAsset): AssetTypeRow {
  return {
    id: r.id,
    name: r.name,
    monthlyTargetCents: r.monthly_target_cents,
    color: r.color,
    icon: r.icon,
    sortOrder: r.sort_order,
    active: r.active,
  };
}

function toAsset(r: AssetTypeRow, userId: string): DbAsset {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    monthly_target_cents: r.monthlyTargetCents,
    color: r.color,
    icon: r.icon,
    sort_order: r.sortOrder,
    active: r.active,
  };
}

type DbIncome = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

function fromIncome(r: DbIncome): IncomeTypeRow {
  return {
    id: r.id,
    name: r.name,
    sortOrder: r.sort_order,
    active: r.active,
  };
}

function toIncome(r: IncomeTypeRow, userId: string): DbIncome {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    sort_order: r.sortOrder,
    active: r.active,
  };
}

type DbExpense = {
  id: string;
  user_id: string;
  name: string;
  monthly_budget_cents: number;
  color: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

function fromExpense(r: DbExpense): ExpenseTypeRow {
  return {
    id: r.id,
    name: r.name,
    monthlyBudgetCents: r.monthly_budget_cents,
    color: r.color,
    icon: r.icon,
    sortOrder: r.sort_order,
    active: r.active,
  };
}

function toExpense(r: ExpenseTypeRow, userId: string): DbExpense {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    monthly_budget_cents: r.monthlyBudgetCents,
    color: r.color,
    icon: r.icon,
    sort_order: r.sortOrder,
    active: r.active,
  };
}

type DbGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount_cents: number;
  target_year: number;
  type: string;
  asset_type_id: string | null;
  sort_order: number;
  active: boolean;
};

function fromGoal(r: DbGoal): GoalRow {
  return {
    id: r.id,
    name: r.name,
    targetAmountCents: r.target_amount_cents,
    targetYear: r.target_year,
    type: r.type as GoalRow["type"],
    assetTypeId: r.asset_type_id,
    sortOrder: r.sort_order,
    active: r.active,
  };
}

function toGoal(r: GoalRow, userId: string): DbGoal {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    target_amount_cents: r.targetAmountCents,
    target_year: r.targetYear,
    type: r.type,
    asset_type_id: r.assetTypeId,
    sort_order: r.sortOrder,
    active: r.active,
  };
}

type DbSnapshot = {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_income_cents: number;
  total_expenses_cents: number;
  total_invested_cents: number;
  total_liquidity_cents: number;
  total_investment_value_cents: number;
  patrimonio_total_cents: number;
  liquidity_by_platform: Record<string, number>;
  investment_value_by_asset: Record<string, number>;
  investment_capital_by_asset: Record<string, number>;
  closed_at: string;
};

function fromSnapshot(r: DbSnapshot): MonthlySnapshotRow {
  return {
    id: r.id,
    month: r.month,
    year: r.year,
    totalIncomeCents: r.total_income_cents,
    totalExpensesCents: r.total_expenses_cents,
    totalInvestedCents: r.total_invested_cents,
    totalLiquidityCents: r.total_liquidity_cents,
    totalInvestmentValueCents: r.total_investment_value_cents,
    patrimonioTotalCents: r.patrimonio_total_cents,
    liquidityByPlatform: r.liquidity_by_platform ?? {},
    investmentValueByAsset: r.investment_value_by_asset ?? {},
    investmentCapitalByAsset: r.investment_capital_by_asset ?? {},
    closedAt: r.closed_at,
  };
}

function toSnapshot(r: MonthlySnapshotRow, userId: string): DbSnapshot {
  return {
    id: r.id,
    user_id: userId,
    month: r.month,
    year: r.year,
    total_income_cents: r.totalIncomeCents,
    total_expenses_cents: r.totalExpensesCents,
    total_invested_cents: r.totalInvestedCents,
    total_liquidity_cents: r.totalLiquidityCents,
    total_investment_value_cents: r.totalInvestmentValueCents,
    patrimonio_total_cents: r.patrimonioTotalCents,
    liquidity_by_platform: r.liquidityByPlatform,
    investment_value_by_asset: r.investmentValueByAsset,
    investment_capital_by_asset: r.investmentCapitalByAsset,
    closed_at: r.closedAt,
  };
}

type DbTx = {
  id: string;
  user_id: string;
  transacted_on: string;
  month: number;
  year: number;
  type: string;
  amount_cents: number;
  description: string;
  platform_id: string;
  category_id: string;
  unit_price_cents: number | null;
  created_at: string;
  updated_at: string;
};

function fromTx(r: DbTx): TransactionRow {
  return {
    id: r.id,
    date: r.transacted_on,
    month: r.month,
    year: r.year,
    type: r.type as TransactionType,
    amountCents: r.amount_cents,
    description: r.description ?? "",
    platformId: r.platform_id,
    categoryId: r.category_id,
    unitPriceCents: r.unit_price_cents,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toTx(r: TransactionRow, userId: string): DbTx {
  return {
    id: r.id,
    user_id: userId,
    transacted_on: r.date,
    month: r.month,
    year: r.year,
    type: r.type,
    amount_cents: r.amountCents,
    description: r.description,
    platform_id: r.platformId,
    category_id: r.categoryId,
    unit_price_cents: r.unitPriceCents,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

type DbSettings = {
  user_id: string;
  emergency_fund_target_cents: number;
  current_year: number;
  previous_capital_by_asset: Record<string, number>;
};

function fromSettings(r: DbSettings): SettingsRow {
  return {
    id: "default",
    emergencyFundTargetCents: r.emergency_fund_target_cents,
    currentYear: r.current_year,
    previousCapitalByAsset: r.previous_capital_by_asset ?? {},
  };
}

function toSettings(r: SettingsRow, userId: string): DbSettings {
  return {
    user_id: userId,
    emergency_fund_target_cents: r.emergencyFundTargetCents,
    current_year: r.currentYear,
    previous_capital_by_asset: r.previousCapitalByAsset ?? {},
  };
}

export class SupabaseFinanceRepository implements FinanceRepository {
  constructor(
    private readonly sb: SupabaseClient,
    private readonly userId: string,
  ) {}

  async listPlatforms(): Promise<PlatformRow[]> {
    const { data, error } = await this.sb
      .from(T.platforms)
      .select("*")
      .eq("user_id", this.userId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as DbPlatform[]).map(fromPlatform);
  }

  async upsertPlatform(row: PlatformRow): Promise<void> {
    const { error } = await this.sb
      .from(T.platforms)
      .upsert(toPlatform(row, this.userId), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  async deletePlatform(id: string): Promise<void> {
    const { error } = await this.sb
      .from(T.platforms)
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
  }

  async listAssetTypes(): Promise<AssetTypeRow[]> {
    const { data, error } = await this.sb
      .from(T.assets)
      .select("*")
      .eq("user_id", this.userId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as DbAsset[]).map(fromAsset);
  }

  async upsertAssetType(row: AssetTypeRow): Promise<void> {
    const { error } = await this.sb
      .from(T.assets)
      .upsert(toAsset(row, this.userId), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  async deleteAssetType(id: string): Promise<void> {
    const { error } = await this.sb
      .from(T.assets)
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
  }

  async listIncomeTypes(): Promise<IncomeTypeRow[]> {
    const { data, error } = await this.sb
      .from(T.income)
      .select("*")
      .eq("user_id", this.userId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as DbIncome[]).map(fromIncome);
  }

  async upsertIncomeType(row: IncomeTypeRow): Promise<void> {
    const { error } = await this.sb
      .from(T.income)
      .upsert(toIncome(row, this.userId), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  async deleteIncomeType(id: string): Promise<void> {
    const { error } = await this.sb
      .from(T.income)
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
  }

  async listExpenseTypes(): Promise<ExpenseTypeRow[]> {
    const { data, error } = await this.sb
      .from(T.expense)
      .select("*")
      .eq("user_id", this.userId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as DbExpense[]).map(fromExpense);
  }

  async upsertExpenseType(row: ExpenseTypeRow): Promise<void> {
    const { error } = await this.sb
      .from(T.expense)
      .upsert(toExpense(row, this.userId), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  async deleteExpenseType(id: string): Promise<void> {
    const { error } = await this.sb
      .from(T.expense)
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
  }

  async listGoals(): Promise<GoalRow[]> {
    const { data, error } = await this.sb
      .from(T.goals)
      .select("*")
      .eq("user_id", this.userId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as DbGoal[]).map(fromGoal);
  }

  async upsertGoal(row: GoalRow): Promise<void> {
    const { error } = await this.sb
      .from(T.goals)
      .upsert(toGoal(row, this.userId), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  async deleteGoal(id: string): Promise<void> {
    const { error } = await this.sb
      .from(T.goals)
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
  }

  async getSettings(): Promise<SettingsRow | undefined> {
    const { data, error } = await this.sb
      .from(T.settings)
      .select("*")
      .eq("user_id", this.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      const y = new Date().getFullYear();
      const row: SettingsRow = {
        id: "default",
        emergencyFundTargetCents: 1_000_000,
        currentYear: y,
        previousCapitalByAsset: {},
      };
      await this.upsertSettings(row);
      return row;
    }
    return fromSettings(data as DbSettings);
  }

  async upsertSettings(row: SettingsRow): Promise<void> {
    const { error } = await this.sb
      .from(T.settings)
      .upsert(toSettings(row, this.userId), { onConflict: "user_id" });
    if (error) throw new Error(error.message);
  }

  async listTransactions(filter?: TransactionFilter): Promise<TransactionRow[]> {
    const { data, error } = await this.sb
      .from(T.transactions)
      .select("*")
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
    const rows = (data as DbTx[]).map(fromTx);
    const filtered = rows.filter((t) => matchTransaction(t, filter));
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return filtered;
  }

  async getTransaction(id: string): Promise<TransactionRow | undefined> {
    const { data, error } = await this.sb
      .from(T.transactions)
      .select("*")
      .eq("id", id)
      .eq("user_id", this.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return undefined;
    return fromTx(data as DbTx);
  }

  async upsertTransaction(row: TransactionRow): Promise<void> {
    const { error } = await this.sb
      .from(T.transactions)
      .upsert(toTx(row, this.userId), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await this.sb
      .from(T.transactions)
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
  }

  async listSnapshots(): Promise<MonthlySnapshotRow[]> {
    const { data, error } = await this.sb
      .from(T.snapshots)
      .select("*")
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
    const rows = (data as DbSnapshot[]).map(fromSnapshot);
    rows.sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month,
    );
    return rows;
  }

  async getSnapshot(
    year: number,
    month: number,
  ): Promise<MonthlySnapshotRow | undefined> {
    const { data, error } = await this.sb
      .from(T.snapshots)
      .select("*")
      .eq("user_id", this.userId)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return undefined;
    return fromSnapshot(data as DbSnapshot);
  }

  async upsertSnapshot(row: MonthlySnapshotRow): Promise<void> {
    const { error } = await this.sb
      .from(T.snapshots)
      .upsert(toSnapshot(row, this.userId), {
        onConflict: "user_id,year,month",
      });
    if (error) throw new Error(error.message);
  }

  async deleteSnapshot(id: string): Promise<void> {
    const { error } = await this.sb
      .from(T.snapshots)
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
  }

  async exportAll(): Promise<ExportBundleV1> {
    const [
      platforms,
      assetTypes,
      incomeTypes,
      expenseTypes,
      goals,
      settings,
      monthlySnapshots,
      transactions,
    ] = await Promise.all([
      this.listPlatforms(),
      this.listAssetTypes(),
      this.listIncomeTypes(),
      this.listExpenseTypes(),
      this.listGoals(),
      this.getSettings(),
      this.listSnapshots(),
      this.listTransactions(),
    ]);
    if (!settings) {
      throw new Error("Settings no disponibles");
    }
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      platforms,
      assetTypes,
      incomeTypes,
      expenseTypes,
      transactions,
      monthlySnapshots,
      goals,
      settings,
    };
  }

  async importAll(bundle: ExportBundleV1): Promise<void> {
    if (bundle.version !== 1) throw new Error("Versión de export no soportada");
    const uid = this.userId;
    const tables = [
      T.transactions,
      T.snapshots,
      T.goals,
      T.expense,
      T.income,
      T.assets,
      T.platforms,
      T.settings,
    ] as const;
    for (const table of tables) {
      const { error } = await this.sb.from(table).delete().eq("user_id", uid);
      if (error) throw new Error(error.message);
    }
    for (const p of bundle.platforms) await this.upsertPlatform(p);
    for (const a of bundle.assetTypes) await this.upsertAssetType(a);
    for (const i of bundle.incomeTypes) await this.upsertIncomeType(i);
    for (const e of bundle.expenseTypes) await this.upsertExpenseType(e);
    for (const g of bundle.goals) await this.upsertGoal(g);
    await this.upsertSettings(bundle.settings);
    for (const s of bundle.monthlySnapshots) await this.upsertSnapshot(s);
    for (const t of bundle.transactions) await this.upsertTransaction(t);
  }
}
