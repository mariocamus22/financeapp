import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinanceRepository } from "./finance-repository";
import { LocalFinanceRepository } from "./local-finance-repository";
import { SupabaseFinanceRepository } from "./supabase-finance-repository";

export class DelegatingFinanceRepository implements FinanceRepository {
  private readonly local: LocalFinanceRepository;
  private remote: SupabaseFinanceRepository | null = null;

  constructor(local: LocalFinanceRepository) {
    this.local = local;
  }

  /** Con sesión Supabase: lectura/escritura en Postgres. Sin sesión: IndexedDB local. */
  setRemote(client: SupabaseClient | null, userId: string | null) {
    if (client && userId) {
      this.remote = new SupabaseFinanceRepository(client, userId);
    } else {
      this.remote = null;
    }
  }

  private impl(): FinanceRepository {
    return this.remote ?? this.local;
  }

  listPlatforms() {
    return this.impl().listPlatforms();
  }
  upsertPlatform(row: Parameters<FinanceRepository["upsertPlatform"]>[0]) {
    return this.impl().upsertPlatform(row);
  }
  deletePlatform(id: string) {
    return this.impl().deletePlatform(id);
  }
  listAssetTypes() {
    return this.impl().listAssetTypes();
  }
  upsertAssetType(row: Parameters<FinanceRepository["upsertAssetType"]>[0]) {
    return this.impl().upsertAssetType(row);
  }
  deleteAssetType(id: string) {
    return this.impl().deleteAssetType(id);
  }
  listIncomeTypes() {
    return this.impl().listIncomeTypes();
  }
  upsertIncomeType(row: Parameters<FinanceRepository["upsertIncomeType"]>[0]) {
    return this.impl().upsertIncomeType(row);
  }
  deleteIncomeType(id: string) {
    return this.impl().deleteIncomeType(id);
  }
  listExpenseTypes() {
    return this.impl().listExpenseTypes();
  }
  upsertExpenseType(row: Parameters<FinanceRepository["upsertExpenseType"]>[0]) {
    return this.impl().upsertExpenseType(row);
  }
  deleteExpenseType(id: string) {
    return this.impl().deleteExpenseType(id);
  }
  listGoals() {
    return this.impl().listGoals();
  }
  upsertGoal(row: Parameters<FinanceRepository["upsertGoal"]>[0]) {
    return this.impl().upsertGoal(row);
  }
  deleteGoal(id: string) {
    return this.impl().deleteGoal(id);
  }
  getSettings() {
    return this.impl().getSettings();
  }
  upsertSettings(row: Parameters<FinanceRepository["upsertSettings"]>[0]) {
    return this.impl().upsertSettings(row);
  }
  listTransactions(filter?: Parameters<FinanceRepository["listTransactions"]>[0]) {
    return this.impl().listTransactions(filter);
  }
  getTransaction(id: string) {
    return this.impl().getTransaction(id);
  }
  upsertTransaction(row: Parameters<FinanceRepository["upsertTransaction"]>[0]) {
    return this.impl().upsertTransaction(row);
  }
  deleteTransaction(id: string) {
    return this.impl().deleteTransaction(id);
  }
  listSnapshots() {
    return this.impl().listSnapshots();
  }
  getSnapshot(year: number, month: number) {
    return this.impl().getSnapshot(year, month);
  }
  upsertSnapshot(row: Parameters<FinanceRepository["upsertSnapshot"]>[0]) {
    return this.impl().upsertSnapshot(row);
  }
  deleteSnapshot(id: string) {
    return this.impl().deleteSnapshot(id);
  }
  exportAll() {
    return this.impl().exportAll();
  }
  importAll(bundle: Parameters<FinanceRepository["importAll"]>[0]) {
    return this.impl().importAll(bundle);
  }
}
