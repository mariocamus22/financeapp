import type {
  AssetTypeRow,
  ExpenseTypeRow,
  GoalRow,
  IncomeTypeRow,
  PlatformRow,
  SettingsRow,
} from "@/types/finance";
import type { FinanceDatabase } from "./database";
import { IDS } from "./ids";

export async function seedIfEmpty(db: FinanceDatabase): Promise<void> {
  const count = await db.platforms.count();
  if (count > 0) return;

  const platforms: PlatformRow[] = [
    {
      id: IDS.platform.sabadell,
      name: "Sabadell",
      type: "LIQUIDITY",
      color: "#6366f1",
      icon: "landmark",
      sortOrder: 0,
      active: true,
    },
    {
      id: IDS.platform.santander,
      name: "Santander",
      type: "LIQUIDITY",
      color: "#ec4899",
      icon: "landmark",
      sortOrder: 1,
      active: true,
    },
    {
      id: IDS.platform.efectivo,
      name: "Efectivo",
      type: "LIQUIDITY",
      color: "#10b981",
      icon: "banknote",
      sortOrder: 2,
      active: true,
    },
    {
      id: IDS.platform.cobee,
      name: "Cobee",
      type: "LIQUIDITY",
      color: "#f59e0b",
      icon: "wallet",
      sortOrder: 3,
      active: true,
    },
    {
      id: IDS.platform.trLiquidity,
      name: "Trade Republic",
      type: "LIQUIDITY",
      color: "#14b8a6",
      icon: "smartphone",
      sortOrder: 4,
      active: true,
    },
    {
      id: IDS.platform.indexaLiquidity,
      name: "Indexa Capital",
      type: "LIQUIDITY",
      color: "#3b82f6",
      icon: "pie-chart",
      sortOrder: 5,
      active: true,
    },
    {
      id: IDS.platform.revolut,
      name: "Revolut",
      type: "LIQUIDITY",
      color: "#8b5cf6",
      icon: "credit-card",
      sortOrder: 6,
      active: true,
    },
    {
      id: IDS.platform.bitvavoCash,
      name: "Bitvavo",
      type: "LIQUIDITY",
      color: "#06b6d4",
      icon: "coins",
      sortOrder: 7,
      active: true,
    },
    {
      id: IDS.platform.bitvavoInv,
      name: "Bitvavo",
      type: "INVESTMENT",
      color: "#06b6d4",
      icon: "line-chart",
      sortOrder: 0,
      active: true,
    },
    {
      id: IDS.platform.trInv,
      name: "Trade Republic",
      type: "INVESTMENT",
      color: "#14b8a6",
      icon: "line-chart",
      sortOrder: 1,
      active: true,
    },
    {
      id: IDS.platform.indexaInv,
      name: "Indexa Capital",
      type: "INVESTMENT",
      color: "#3b82f6",
      icon: "line-chart",
      sortOrder: 2,
      active: true,
    },
  ];

  const assetTypes: AssetTypeRow[] = [
    {
      id: IDS.asset.fondos,
      name: "Fondos Indexados+RF",
      monthlyTargetCents: 700_00,
      color: "#6366f1",
      icon: "trending-up",
      sortOrder: 0,
      active: true,
    },
    {
      id: IDS.asset.oro,
      name: "Oro",
      monthlyTargetCents: 200_00,
      color: "#eab308",
      icon: "circle-dot",
      sortOrder: 1,
      active: true,
    },
    {
      id: IDS.asset.acciones,
      name: "Acciones",
      monthlyTargetCents: 400_00,
      color: "#22c55e",
      icon: "activity",
      sortOrder: 2,
      active: true,
    },
    {
      id: IDS.asset.cripto,
      name: "Criptomonedas",
      monthlyTargetCents: 300_00,
      color: "#a855f7",
      icon: "bitcoin",
      sortOrder: 3,
      active: true,
    },
    {
      id: IDS.asset.plata,
      name: "Plata",
      monthlyTargetCents: 0,
      color: "#94a3b8",
      icon: "gem",
      sortOrder: 4,
      active: true,
    },
  ];

  const incomeTypes: IncomeTypeRow[] = [
    { id: IDS.income.nomina, name: "Nómina", sortOrder: 0, active: true },
    {
      id: IDS.income.remuneracion,
      name: "Remuneración",
      sortOrder: 1,
      active: true,
    },
    { id: IDS.income.extra, name: "Extra", sortOrder: 2, active: true },
  ];

  const expenseTypes: ExpenseTypeRow[] = [
    {
      id: IDS.expense.alquiler,
      name: "Alquiler",
      monthlyBudgetCents: 539_00,
      color: "#ef4444",
      icon: "home",
      sortOrder: 0,
      active: true,
    },
    {
      id: IDS.expense.suministros,
      name: "Suministros",
      monthlyBudgetCents: 55_00,
      color: "#f97316",
      icon: "zap",
      sortOrder: 1,
      active: true,
    },
    {
      id: IDS.expense.supermercado,
      name: "Supermercado",
      monthlyBudgetCents: 200_00,
      color: "#22c55e",
      icon: "shopping-cart",
      sortOrder: 2,
      active: true,
    },
    {
      id: IDS.expense.restaurante,
      name: "Restaurante",
      monthlyBudgetCents: 150_00,
      color: "#eab308",
      icon: "utensils",
      sortOrder: 3,
      active: true,
    },
    {
      id: IDS.expense.ocio,
      name: "Ocio",
      monthlyBudgetCents: 200_00,
      color: "#8b5cf6",
      icon: "party-popper",
      sortOrder: 4,
      active: true,
    },
    {
      id: IDS.expense.transporte,
      name: "Transporte",
      monthlyBudgetCents: 60_00,
      color: "#0ea5e9",
      icon: "bus",
      sortOrder: 5,
      active: true,
    },
    {
      id: IDS.expense.gimnasio,
      name: "Gimnasio",
      monthlyBudgetCents: 47_00,
      color: "#64748b",
      icon: "dumbbell",
      sortOrder: 6,
      active: true,
    },
    {
      id: IDS.expense.estudios,
      name: "Estudios",
      monthlyBudgetCents: 50_00,
      color: "#6366f1",
      icon: "graduation-cap",
      sortOrder: 7,
      active: true,
    },
    {
      id: IDS.expense.serviciosOnline,
      name: "Servicios y productos online",
      monthlyBudgetCents: 7_00,
      color: "#94a3b8",
      icon: "cloud",
      sortOrder: 8,
      active: true,
    },
    {
      id: IDS.expense.cargosBancarios,
      name: "Cargos bancarios",
      monthlyBudgetCents: 0,
      color: "#64748b",
      icon: "landmark",
      sortOrder: 9,
      active: true,
    },
    {
      id: IDS.expense.comprasPersonales,
      name: "Compras personales",
      monthlyBudgetCents: 0,
      color: "#ec4899",
      icon: "shopping-bag",
      sortOrder: 10,
      active: true,
    },
    {
      id: IDS.expense.viajes,
      name: "Viajes",
      monthlyBudgetCents: 150_00,
      color: "#06b6d4",
      icon: "plane",
      sortOrder: 11,
      active: true,
    },
  ];

  const goals: GoalRow[] = [
    {
      id: IDS.goal.pat2026,
      name: "Patrimonio 2026",
      targetAmountCents: 80_000_00,
      targetYear: 2026,
      type: "PATRIMONY",
      assetTypeId: null,
      sortOrder: 0,
      active: true,
    },
    {
      id: IDS.goal.pat2027,
      name: "Patrimonio 2027",
      targetAmountCents: 150_000_00,
      targetYear: 2027,
      type: "PATRIMONY",
      assetTypeId: null,
      sortOrder: 1,
      active: true,
    },
    {
      id: IDS.goal.pat2030,
      name: "Patrimonio 2030",
      targetAmountCents: 300_000_00,
      targetYear: 2030,
      type: "PATRIMONY",
      assetTypeId: null,
      sortOrder: 2,
      active: true,
    },
    {
      id: "60000000-0006-4000-8000-000000000004",
      name: "Fondos indexados",
      targetAmountCents: 250_000_00,
      targetYear: 2035,
      type: "ASSET",
      assetTypeId: IDS.asset.fondos,
      sortOrder: 3,
      active: true,
    },
    {
      id: "60000000-0006-4000-8000-000000000005",
      name: "Criptomonedas",
      targetAmountCents: 1_000_000_00,
      targetYear: 2040,
      type: "ASSET",
      assetTypeId: IDS.asset.cripto,
      sortOrder: 4,
      active: true,
    },
  ];

  const settings: SettingsRow = {
    id: "default",
    emergencyFundTargetCents: 10_000_00,
    currentYear: new Date().getFullYear(),
    previousCapitalByAsset: {
      [IDS.asset.fondos]: 0,
      [IDS.asset.oro]: 0,
      [IDS.asset.acciones]: 0,
      [IDS.asset.cripto]: 0,
      [IDS.asset.plata]: 0,
    },
  };

  await db.transaction(
    "rw",
    [
      db.platforms,
      db.assetTypes,
      db.incomeTypes,
      db.expenseTypes,
      db.goals,
      db.settings,
    ],
    async () => {
      await db.platforms.bulkAdd(platforms);
      await db.assetTypes.bulkAdd(assetTypes);
      await db.incomeTypes.bulkAdd(incomeTypes);
      await db.expenseTypes.bulkAdd(expenseTypes);
      await db.goals.bulkAdd(goals);
      await db.settings.put(settings);
    },
  );

}
