import type {
  MonthlySnapshotRow,
  PlatformRow,
  SettingsRow,
  TransactionRow,
  YearMonth,
} from "@/types/finance";

export type PeriodTotals = {
  incomeCents: number;
  expenseCents: number;
  investmentCents: number;
};

export function transactionsInPeriod(
  txs: TransactionRow[],
  year: number,
  month: number,
): TransactionRow[] {
  return txs.filter((t) => t.year === year && t.month === month);
}

export function totalsForPeriod(
  txs: TransactionRow[],
  year: number,
  month: number,
): PeriodTotals {
  const slice = transactionsInPeriod(txs, year, month);
  let incomeCents = 0;
  let expenseCents = 0;
  let investmentCents = 0;
  for (const t of slice) {
    if (t.type === "INCOME") incomeCents += t.amountCents;
    else if (t.type === "EXPENSE") expenseCents += t.amountCents;
    else investmentCents += t.amountCents;
  }
  return { incomeCents, expenseCents, investmentCents };
}

export function liquidityBalancesByPlatform(
  txs: TransactionRow[],
  platforms: PlatformRow[],
): Record<string, number> {
  const liqIds = new Set(
    platforms.filter((p) => p.type === "LIQUIDITY" && p.active).map((p) => p.id),
  );
  const balances: Record<string, number> = {};
  for (const id of liqIds) balances[id] = 0;

  const sorted = [...txs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  for (const t of sorted) {
    if (!liqIds.has(t.platformId)) continue;
    const sign =
      t.type === "INCOME" ? 1 : t.type === "EXPENSE" || t.type === "INVESTMENT" ? -1 : 0;
    balances[t.platformId] = (balances[t.platformId] ?? 0) + sign * t.amountCents;
  }
  return balances;
}

export function totalLiquidityCents(
  txs: TransactionRow[],
  platforms: PlatformRow[],
): number {
  const m = liquidityBalancesByPlatform(txs, platforms);
  return Object.values(m).reduce((a, b) => a + b, 0);
}

export function investmentCapitalByAsset(
  txs: TransactionRow[],
  settings: SettingsRow,
): Record<string, number> {
  const out: Record<string, number> = { ...settings.previousCapitalByAsset };
  const sorted = [...txs]
    .filter((t) => t.type === "INVESTMENT")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const t of sorted) {
    out[t.categoryId] = (out[t.categoryId] ?? 0) + t.amountCents;
  }
  return out;
}

export function totalInvestmentCapitalCents(capitalByAsset: Record<string, number>): number {
  return Object.values(capitalByAsset).reduce((a, b) => a + b, 0);
}

/** Valor estimado: último snapshot por activo + aportaciones posteriores (MVP sin precio de mercado). */
export function investmentValueByAssetEstimate(args: {
  txs: TransactionRow[];
  snapshots: MonthlySnapshotRow[];
  settings: SettingsRow;
}): Record<string, number> {
  const { txs, snapshots, settings } = args;
  const capital = investmentCapitalByAsset(txs, settings);
  const last = [...snapshots].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.month - a.month,
  )[0];

  if (!last) {
    return { ...capital };
  }

  const baseValue = { ...last.investmentValueByAsset };
  const lastClosed = new Date(last.closedAt).getTime();
  const flowsAfter = txs
    .filter((t) => t.type === "INVESTMENT")
    .filter((t) => new Date(t.date).getTime() > lastClosed);

  const value: Record<string, number> = { ...baseValue };
  for (const id of Object.keys(capital)) {
    if (value[id] === undefined) value[id] = capital[id] ?? 0;
  }
  for (const t of flowsAfter) {
    value[t.categoryId] = (value[t.categoryId] ?? 0) + t.amountCents;
  }
  for (const id of Object.keys(capital)) {
    if (value[id] === undefined) value[id] = capital[id] ?? 0;
  }
  return value;
}

export function totalPatrimonioCents(args: {
  liquidityTotal: number;
  investmentValueTotal: number;
}): number {
  return args.liquidityTotal + args.investmentValueTotal;
}

export function yearSavingsRunning(
  txs: TransactionRow[],
  year: number,
): Record<number, number> {
  const byMonth: Record<number, PeriodTotals> = {};
  for (let m = 1; m <= 12; m++) {
    byMonth[m] = totalsForPeriod(txs, year, m);
  }
  const running: Record<number, number> = {};
  let acc = 0;
  for (let m = 1; m <= 12; m++) {
    const t = byMonth[m];
    const saving = t.incomeCents - t.expenseCents - t.investmentCents;
    acc += saving;
    running[m] = acc;
  }
  return running;
}

export function lastNClosedMonths(
  today: YearMonth,
  n: number,
): YearMonth[] {
  const out: YearMonth[] = [];
  let y = today.year;
  let m = today.month;
  for (let i = 0; i < n; i++) {
    out.push({ year: y, month: m });
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}

function isOnOrBeforePeriod(t: TransactionRow, ym: YearMonth): boolean {
  if (t.year < ym.year) return true;
  if (t.year > ym.year) return false;
  return t.month <= ym.month;
}

/** Aproximación MVP: liquidez + capital invertido acumulado a cierre de mes. */
export function approxPatrimonioAtMonthEnd(
  txs: TransactionRow[],
  platforms: PlatformRow[],
  settings: SettingsRow,
  ym: YearMonth,
): number {
  const txsUpTo = txs.filter((t) => isOnOrBeforePeriod(t, ym));
  const liq = totalLiquidityCents(txsUpTo, platforms);
  const cap = investmentCapitalByAsset(txsUpTo, settings);
  const inv = Object.values(cap).reduce((a, b) => a + b, 0);
  return liq + inv;
}

export function buildMonthlySnapshot(args: {
  year: number;
  month: number;
  txs: TransactionRow[];
  platforms: PlatformRow[];
  settings: SettingsRow;
}): MonthlySnapshotRow {
  const { year, month, txs, platforms, settings } = args;
  const ym: YearMonth = { year, month };
  const totals = totalsForPeriod(txs, year, month);
  const txsUpTo = txs.filter((t) => isOnOrBeforePeriod(t, ym));
  const liq = liquidityBalancesByPlatform(txsUpTo, platforms);
  const cap = investmentCapitalByAsset(txsUpTo, settings);
  const value = { ...cap };
  const totalLiq = Object.values(liq).reduce((a, b) => a + b, 0);
  const totalVal = Object.values(value).reduce((a, b) => a + b, 0);

  return {
    id: crypto.randomUUID(),
    year,
    month,
    totalIncomeCents: totals.incomeCents,
    totalExpensesCents: totals.expenseCents,
    totalInvestedCents: totals.investmentCents,
    totalLiquidityCents: totalLiq,
    totalInvestmentValueCents: totalVal,
    patrimonioTotalCents: totalLiq + totalVal,
    liquidityByPlatform: liq,
    investmentValueByAsset: value,
    investmentCapitalByAsset: cap,
    closedAt: new Date().toISOString(),
  };
}
