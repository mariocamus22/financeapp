import { describe, expect, it } from "vitest";
import type { PlatformRow, SettingsRow, TransactionRow } from "@/types/finance";
import { IDS } from "@/db/ids";
import {
  investmentCapitalByAsset,
  investmentFlowsByAssetInMonth,
  liquidityBalancesByPlatform,
  totalsForPeriod,
  totalsForYearThroughMonth,
  totalLiquidityCents,
} from "./aggregates";

const settings: SettingsRow = {
  id: "default",
  emergencyFundTargetCents: 0,
  currentYear: 2026,
  previousCapitalByAsset: { [IDS.asset.fondos]: 1000_00 },
};

const platforms: PlatformRow[] = [
  {
    id: IDS.platform.sabadell,
    name: "Sabadell",
    type: "LIQUIDITY",
    color: "#fff",
    icon: "x",
    sortOrder: 0,
    active: true,
  },
];

let _id = 0;
const mk = (t: Partial<TransactionRow> & Pick<TransactionRow, "type" | "amountCents">) =>
  ({
    id: `00000000-0000-4000-8000-${String(++_id).padStart(12, "0")}`,
    date: "2026-04-10",
    year: 2026,
    month: 4,
    description: "",
    platformId: IDS.platform.sabadell,
    categoryId: IDS.income.nomina,
    unitPriceCents: null,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    ...t,
  }) as TransactionRow;

describe("totalsForPeriod", () => {
  it("suma ingresos, gastos e inversión del mes", () => {
    const txs: TransactionRow[] = [
      mk({ type: "INCOME", amountCents: 2000_00, categoryId: IDS.income.nomina }),
      mk({ type: "EXPENSE", amountCents: 500_00, categoryId: IDS.expense.alquiler }),
      mk({
        type: "INVESTMENT",
        amountCents: 300_00,
        categoryId: IDS.asset.fondos,
        platformId: IDS.platform.trInv,
      }),
    ];
    const t = totalsForPeriod(txs, 2026, 4);
    expect(t.incomeCents).toBe(2000_00);
    expect(t.expenseCents).toBe(500_00);
    expect(t.investmentCents).toBe(300_00);
  });
});

describe("liquidityBalancesByPlatform", () => {
  it("actualiza saldo por plataforma de liquidez", () => {
    const txs: TransactionRow[] = [
      mk({ type: "INCOME", amountCents: 1000_00 }),
      mk({ type: "EXPENSE", amountCents: 200_00, categoryId: IDS.expense.alquiler }),
    ];
    const b = liquidityBalancesByPlatform(txs, platforms);
    expect(b[IDS.platform.sabadell]).toBe(800_00);
  });
});

describe("investmentCapitalByAsset", () => {
  it("incluye capital previo y aportaciones", () => {
    const txs: TransactionRow[] = [
      mk({
        type: "INVESTMENT",
        amountCents: 250_00,
        categoryId: IDS.asset.fondos,
        platformId: IDS.platform.trInv,
      }),
    ];
    const c = investmentCapitalByAsset(txs, settings);
    expect(c[IDS.asset.fondos]).toBe(1250_00);
  });
});

describe("totalLiquidityCents", () => {
  it("suma todas las plataformas de liquidez", () => {
    const txs: TransactionRow[] = [mk({ type: "INCOME", amountCents: 100_00 })];
    expect(totalLiquidityCents(txs, platforms)).toBe(100_00);
  });
});

describe("totalsForYearThroughMonth", () => {
  it("acumula varios meses del mismo año", () => {
    const txs: TransactionRow[] = [
      mk({
        type: "INCOME",
        amountCents: 100_00,
        month: 1,
        date: "2026-01-05",
        categoryId: IDS.income.nomina,
      }),
      mk({
        type: "EXPENSE",
        amountCents: 40_00,
        month: 2,
        date: "2026-02-05",
        categoryId: IDS.expense.alquiler,
      }),
      mk({
        type: "INVESTMENT",
        amountCents: 10_00,
        month: 3,
        date: "2026-03-05",
        categoryId: IDS.asset.fondos,
        platformId: IDS.platform.trInv,
      }),
    ];
    const t2 = totalsForYearThroughMonth(txs, 2026, 2);
    expect(t2.incomeCents).toBe(100_00);
    expect(t2.expenseCents).toBe(40_00);
    expect(t2.investmentCents).toBe(0);

    const t3 = totalsForYearThroughMonth(txs, 2026, 3);
    expect(t3.investmentCents).toBe(10_00);
  });
});

describe("investmentFlowsByAssetInMonth", () => {
  it("agrupa solo inversiones del mes", () => {
    const txs: TransactionRow[] = [
      mk({
        type: "INVESTMENT",
        amountCents: 100_00,
        month: 4,
        categoryId: IDS.asset.fondos,
        platformId: IDS.platform.trInv,
      }),
      mk({
        type: "INVESTMENT",
        amountCents: 50_00,
        month: 3,
        date: "2026-03-10",
        categoryId: IDS.asset.fondos,
        platformId: IDS.platform.trInv,
      }),
    ];
    const m = investmentFlowsByAssetInMonth(txs, 2026, 4);
    expect(m[IDS.asset.fondos]).toBe(100_00);
  });
});
