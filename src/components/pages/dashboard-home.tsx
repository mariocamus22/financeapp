"use client";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { loadBootstrap } from "@/lib/load-bootstrap";
import { QK } from "@/lib/query-keys";
import {
  investmentFlowsByAssetInMonth,
  investmentFlowsByAssetInYear,
  investmentValueByAssetEstimate,
  patrimonioBreakdownAtMonthEnd,
  totalsForPeriod,
  totalsForYear,
  totalsForYearThroughMonth,
  totalLiquidityCents,
} from "@/lib/finance/aggregates";
import {
  formatEuroCompactFromCents,
  formatEuroFromCents,
} from "@/lib/finance/format";
import { monthShortLabelEs } from "@/lib/finance/month-names";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { YearMonth } from "@/types/finance";

type Granularity = "month" | "year";

function compareYearMonth(a: YearMonth, b: YearMonth): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

function prevYearMonth(ym: YearMonth): YearMonth {
  if (ym.month === 1) return { year: ym.year - 1, month: 12 };
  return { year: ym.year, month: ym.month - 1 };
}

function pctVsPrev(current: number, prev: number): number | null {
  if (prev === 0) return current === 0 ? null : null;
  return ((current - prev) / prev) * 100;
}

function formatSignedPct(p: number | null): string | null {
  if (p == null || !Number.isFinite(p)) return null;
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(1)}%`;
}

export function DashboardHome() {
  const { data, isPending } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });

  const now = useMemo(() => new Date(), []);
  const anchor: YearMonth = useMemo(
    () => ({ year: now.getFullYear(), month: now.getMonth() + 1 }),
    [now],
  );

  const [granularity, setGranularity] = useState<Granularity>("month");
  const [calendarYear, setCalendarYear] = useState(anchor.year);
  const [selectedMonth, setSelectedMonth] = useState(anchor.month);

  useEffect(() => {
    const maxM = calendarYear === anchor.year ? anchor.month : 12;
    if (selectedMonth > maxM) setSelectedMonth(maxM);
  }, [calendarYear, anchor.year, anchor.month, selectedMonth]);

  const view = useMemo(() => {
    if (!data) return null;
    const { transactions, platforms, settings, snapshots, assetTypes } = data;

    const maxMonthForYear =
      calendarYear === anchor.year ? anchor.month : 12;
    const monthClamped = Math.min(selectedMonth, maxMonthForYear);
    const selectedYm: YearMonth = { year: calendarYear, month: monthClamped };

    const isFuture =
      compareYearMonth(selectedYm, anchor) > 0 ||
      (granularity === "year" && calendarYear > anchor.year);

    const liqLive = totalLiquidityCents(transactions, platforms);
    const valueByLive = investmentValueByAssetEstimate({
      txs: transactions,
      snapshots,
      settings,
    });
    const valueTotalLive = Object.values(valueByLive).reduce((a, b) => a + b, 0);
    const patrimonioLive = liqLive + valueTotalLive;

    const endYmForYearView: YearMonth =
      calendarYear === anchor.year ? anchor : { year: calendarYear, month: 12 };

    const isLiveMonthView =
      granularity === "month" &&
      selectedYm.year === anchor.year &&
      selectedYm.month === anchor.month;

    const isLiveYearBalances =
      granularity === "year" && calendarYear === anchor.year;

    let patrimonioCents: number;
    let liquidityCents: number;
    let valueByAsset: Record<string, number>;
    let breakdownSource: "live" | "snapshot" | "estimate";

    if (isFuture) {
      patrimonioCents = 0;
      liquidityCents = 0;
      valueByAsset = {};
      breakdownSource = "estimate";
    } else if (granularity === "month") {
      if (isLiveMonthView) {
        patrimonioCents = patrimonioLive;
        liquidityCents = liqLive;
        valueByAsset = valueByLive;
        breakdownSource = "live";
      } else {
        const b = patrimonioBreakdownAtMonthEnd({
          txs: transactions,
          platforms,
          settings,
          snapshots,
          ym: selectedYm,
        });
        patrimonioCents = b.patrimonioCents;
        liquidityCents = b.liquidityCents;
        valueByAsset = b.valueByAsset;
        breakdownSource = b.source === "snapshot" ? "snapshot" : "estimate";
      }
    } else {
      if (isLiveYearBalances) {
        patrimonioCents = patrimonioLive;
        liquidityCents = liqLive;
        valueByAsset = valueByLive;
        breakdownSource = "live";
      } else {
        const b = patrimonioBreakdownAtMonthEnd({
          txs: transactions,
          platforms,
          settings,
          snapshots,
          ym: endYmForYearView,
        });
        patrimonioCents = b.patrimonioCents;
        liquidityCents = b.liquidityCents;
        valueByAsset = b.valueByAsset;
        breakdownSource = b.source === "snapshot" ? "snapshot" : "estimate";
      }
    }

    const periodTotals =
      granularity === "month"
        ? totalsForPeriod(transactions, selectedYm.year, selectedYm.month)
        : calendarYear === anchor.year
          ? totalsForYearThroughMonth(transactions, calendarYear, anchor.month)
          : totalsForYear(transactions, calendarYear);

    const savingCents =
      periodTotals.incomeCents -
      periodTotals.expenseCents -
      periodTotals.investmentCents;

    const flowsByAsset =
      granularity === "month"
        ? investmentFlowsByAssetInMonth(
            transactions,
            selectedYm.year,
            selectedYm.month,
          )
        : calendarYear === anchor.year
          ? (() => {
              const acc: Record<string, number> = {};
              for (let m = 1; m <= anchor.month; m++) {
                const part = investmentFlowsByAssetInMonth(
                  transactions,
                  calendarYear,
                  m,
                );
                for (const [k, v] of Object.entries(part)) {
                  acc[k] = (acc[k] ?? 0) + v;
                }
              }
              return acc;
            })()
          : investmentFlowsByAssetInYear(transactions, calendarYear);

    const investedInPeriodCents = Object.values(flowsByAsset).reduce(
      (a, b) => a + b,
      0,
    );

    const prevYmPat =
      granularity === "month" ? prevYearMonth(selectedYm) : { year: calendarYear - 1, month: 12 };

    let prevPatrimonio = 0;
    if (!isFuture) {
      if (granularity === "month") {
        if (
          prevYmPat.year === anchor.year &&
          prevYmPat.month === anchor.month
        ) {
          prevPatrimonio = patrimonioLive;
        } else {
          prevPatrimonio = patrimonioBreakdownAtMonthEnd({
            txs: transactions,
            platforms,
            settings,
            snapshots,
            ym: prevYmPat,
          }).patrimonioCents;
        }
      } else {
        const prevEnd: YearMonth = { year: calendarYear - 1, month: 12 };
        if (calendarYear <= 1970) {
          prevPatrimonio = 0;
        } else {
          prevPatrimonio = patrimonioBreakdownAtMonthEnd({
            txs: transactions,
            platforms,
            settings,
            snapshots,
            ym: prevEnd,
          }).patrimonioCents;
        }
      }
    }

    const deltaPat = patrimonioCents - prevPatrimonio;
    const deltaPatPct = pctVsPrev(patrimonioCents, prevPatrimonio);

    const prevTotals =
      granularity === "month"
        ? totalsForPeriod(
            transactions,
            prevYmPat.year,
            prevYmPat.month,
          )
        : calendarYear === anchor.year
          ? totalsForYearThroughMonth(
              transactions,
              calendarYear - 1,
              anchor.month,
            )
          : totalsForYear(transactions, calendarYear - 1);

    const prevSaving =
      prevTotals.incomeCents -
      prevTotals.expenseCents -
      prevTotals.investmentCents;

    const incomePct = pctVsPrev(periodTotals.incomeCents, prevTotals.incomeCents);
    const expensePct = pctVsPrev(periodTotals.expenseCents, prevTotals.expenseCents);
    const savingPct = pctVsPrev(savingCents, prevSaving);

    const invBookTotal = Object.values(valueByAsset).reduce((a, b) => a + b, 0);

    const sortedAssets = [...assetTypes]
      .filter((a) => a.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const distribution = sortedAssets
      .map((a) => {
        const v = valueByAsset[a.id] ?? 0;
        const share = invBookTotal > 0 ? (v / invBookTotal) * 100 : 0;
        const flow = flowsByAsset[a.id] ?? 0;
        const txCount = transactions.filter(
          (t) =>
            t.type === "INVESTMENT" &&
            t.categoryId === a.id &&
            (granularity === "month"
              ? t.year === selectedYm.year && t.month === selectedYm.month
              : calendarYear === anchor.year
                ? t.year === calendarYear && t.month <= anchor.month
                : t.year === calendarYear),
        ).length;
        return {
          asset: a,
          valueCents: v,
          sharePct: share,
          flowCents: flow,
          txCount,
        };
      })
      .filter((row) => row.valueCents > 0 || row.flowCents > 0)
      .sort((a, b) => b.valueCents - a.valueCents);

    const barSegments = distribution.filter((d) => d.valueCents > 0);

    const emergencyOk =
      settings.emergencyFundTargetCents > 0 &&
      liquidityCents >= settings.emergencyFundTargetCents;

    const periodLabel =
      granularity === "month"
        ? `${monthShortLabelEs(selectedYm.month)} ${selectedYm.year}`
        : calendarYear === anchor.year
          ? `Ene–${monthShortLabelEs(anchor.month)} ${calendarYear}`
          : `Año ${calendarYear}`;

    return {
      isFuture,
      patrimonioCents,
      liquidityCents,
      valueByAsset,
      breakdownSource,
      periodTotals,
      savingCents,
      flowsByAsset,
      investedInPeriodCents,
      deltaPat,
      deltaPatPct,
      incomePct,
      expensePct,
      savingPct,
      invBookTotal,
      distribution,
      barSegments,
      emergencyOk,
      emergencyTarget: settings.emergencyFundTargetCents,
      periodLabel,
      selectedYm,
      monthClamped,
      maxMonthForYear,
      anchor,
    };
  }, [
    data,
    granularity,
    calendarYear,
    selectedMonth,
    anchor,
  ]);

  if (isPending || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-52 w-full rounded-3xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-36 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!view) return null;

  const {
    isFuture,
    patrimonioCents,
    liquidityCents,
    breakdownSource,
    periodTotals,
    savingCents,
    investedInPeriodCents,
    deltaPat,
    deltaPatPct,
    incomePct,
    expensePct,
    savingPct,
    invBookTotal,
    distribution,
    barSegments,
    emergencyOk,
    emergencyTarget,
    periodLabel,
    selectedYm,
    monthClamped,
    maxMonthForYear,
  } = view;

  const monthsRow = Array.from({ length: maxMonthForYear }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-5">
      {/* Cabecera estilo app */}
      <div className="flex items-center justify-between px-0.5">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground transition hover:text-foreground"
          aria-label="Perfil"
        >
          <UserRound className="size-5" />
        </button>
        <span className="text-sm font-semibold tracking-[0.2em] text-foreground">
          INICIO
        </span>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground transition hover:text-foreground"
          aria-label="Notificaciones"
        >
          <Bell className="size-5" />
        </button>
      </div>

      {/* Patrimonio */}
      <section className="rounded-[1.35rem] border border-border/70 bg-gradient-to-b from-card to-card/40 p-5 shadow-lg shadow-black/20">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Patrimonio total
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[2.15rem] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[2.35rem]">
              {isFuture ? (
                "—"
              ) : (
                <AnimatedNumber
                  value={patrimonioCents}
                  format={(n) => formatEuroFromCents(Math.round(n))}
                />
              )}
            </div>
            {!isFuture && (
              <p
                className={cn(
                  "mt-2 text-sm font-medium tabular-nums",
                  deltaPat >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {deltaPat >= 0 ? "+" : ""}
                {formatEuroFromCents(deltaPat)}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  {granularity === "month" ? "vs mes anterior" : "vs cierre año anterior"}
                </span>
              </p>
            )}
          </div>
          {!isFuture && formatSignedPct(deltaPatPct) && (
            <span
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-semibold tabular-nums",
                (deltaPatPct ?? 0) >= 0
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {formatSignedPct(deltaPatPct)}
            </span>
          )}
        </div>
        {breakdownSource !== "live" && !isFuture && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            {breakdownSource === "snapshot"
              ? "Cifras del último cierre de mes guardado."
              : "Estimación sin cierre de mes (capital invertido acumulado)."}
          </p>
        )}
      </section>

      {/* Mes / Año + selector */}
      <div className="rounded-2xl border border-border/70 bg-secondary/40 p-1.5">
        <div className="grid grid-cols-2 gap-1 p-0.5">
          <button
            type="button"
            onClick={() => setGranularity("month")}
            className={cn(
              "rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition",
              granularity === "month"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Mes
          </button>
          <button
            type="button"
            onClick={() => setGranularity("year")}
            className={cn(
              "rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition",
              granularity === "year"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Año
          </button>
        </div>

        {granularity === "month" ? (
          <>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 px-2 pb-1 pt-3">
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/50 text-muted-foreground hover:text-foreground"
                aria-label="Año anterior"
                onClick={() => {
                  setCalendarYear((y) => y - 1);
                  setSelectedMonth(12);
                }}
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {calendarYear}
              </span>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/50 text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Año siguiente"
                disabled={calendarYear >= anchor.year}
                onClick={() => {
                  if (calendarYear < anchor.year) {
                    setCalendarYear((y) => y + 1);
                    setSelectedMonth(1);
                  }
                }}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
            <div className="-mx-1 mt-1 flex gap-1 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {monthsRow.map((m) => {
                const active = m === monthClamped && calendarYear === selectedYm.year;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m);
                    }}
                    className={cn(
                      "flex min-w-[3rem] shrink-0 flex-col items-center rounded-lg px-3 py-2 text-center text-xs font-semibold uppercase transition",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {monthShortLabelEs(m)}
                    {active ? (
                      <span className="mt-1 block h-0.5 w-6 rounded-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.7)]" />
                    ) : (
                      <span className="mt-1 block h-0.5 w-6 opacity-0" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 px-2 py-3">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/50"
              aria-label="Año anterior"
              onClick={() => setCalendarYear((y) => y - 1)}
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-lg font-bold tabular-nums">{calendarYear}</span>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/50 disabled:opacity-30"
              disabled={calendarYear >= anchor.year}
              aria-label="Año siguiente"
              onClick={() => setCalendarYear((y) => y + 1)}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
        <p className="px-2 pb-2 text-center text-[11px] text-muted-foreground">
          Mostrando datos de <span className="text-foreground/90">{periodLabel}</span>
        </p>
      </div>

      {isFuture && (
        <p className="rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-center text-sm text-muted-foreground">
          No hay datos para un periodo futuro.
        </p>
      )}

      {/* Ingresos / Gastos / Ahorro */}
      {!isFuture && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
            <div className="flex items-start justify-between gap-1">
              <ArrowDownRight className="size-4 text-success" />
              {formatSignedPct(incomePct) && (
                <span className="text-[10px] font-semibold text-success">
                  {formatSignedPct(incomePct)}
                </span>
              )}
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Ingresos
            </p>
            <p className="mt-1 truncate text-sm font-bold tabular-nums text-foreground">
              {formatEuroCompactFromCents(periodTotals.incomeCents)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
            <div className="flex items-start justify-between gap-1">
              <ArrowUpRight className="size-4 text-destructive" />
              {formatSignedPct(expensePct) && (
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    (expensePct ?? 0) <= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {formatSignedPct(expensePct)}
                </span>
              )}
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Gastos
            </p>
            <p className="mt-1 truncate text-sm font-bold tabular-nums text-foreground">
              {formatEuroCompactFromCents(periodTotals.expenseCents)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
            <div className="flex items-start justify-between gap-1">
              <PiggyBank className="size-4 text-success" />
              {formatSignedPct(savingPct) && (
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    (savingPct ?? 0) >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {formatSignedPct(savingPct)}
                </span>
              )}
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Ahorro
            </p>
            <p
              className={cn(
                "mt-1 truncate text-sm font-bold tabular-nums",
                savingCents >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {formatEuroCompactFromCents(savingCents)}
            </p>
          </div>
        </div>
      )}

      {/* Liquidez */}
      {!isFuture && (
        <section className="rounded-3xl border border-border/70 bg-card/80 p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Liquidez total
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              {formatEuroFromCents(liquidityCents)}
            </span>
            {emergencyTarget > 0 && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase",
                  emergencyOk
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {emergencyOk ? "Objetivo OK" : "Bajo objetivo"}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Efectivo y equivalentes disponibles según tus cuentas de liquidez a cierre del
            periodo seleccionado.
          </p>
        </section>
      )}

      {/* Inversiones */}
      {!isFuture && (
        <section className="rounded-3xl border border-border/70 bg-card/80 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Inversión en el periodo
            </p>
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {patrimonioCents > 0 && invBookTotal > 0
                ? `${((invBookTotal / patrimonioCents) * 100).toFixed(1)}% patrimonio`
                : ""}
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {formatEuroFromCents(investedInPeriodCents)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Aportaciones registradas (no incluye valoración de mercado).
          </p>

          {barSegments.length > 0 && (
            <div
              className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-muted/50"
              role="img"
              aria-label="Distribución por tipo de activo"
            >
              {barSegments.map((row) => (
                <div
                  key={row.asset.id}
                  className="h-full min-w-[4px] transition-all"
                  style={{
                    flexGrow: row.valueCents,
                    backgroundColor: row.asset.color || "var(--chart-1)",
                  }}
                  title={`${row.asset.name}: ${row.sharePct.toFixed(0)}%`}
                />
              ))}
            </div>
          )}

          <ul className="mt-4 space-y-3">
            {distribution.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">
                Sin posiciones en cartera para este cierre.
              </li>
            ) : (
              distribution.map((row) => (
                <li
                  key={row.asset.id}
                  className="flex gap-3 rounded-2xl border border-border/50 bg-background/30 px-3 py-3"
                >
                  <div
                    className="w-1 shrink-0 rounded-full"
                    style={{
                      backgroundColor: row.asset.color || "var(--chart-1)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground">{row.asset.name}</p>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatEuroFromCents(row.valueCents)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{row.sharePct.toFixed(0)}% del total invertido</span>
                      {row.flowCents > 0 && (
                        <span className="text-success">
                          +{formatEuroCompactFromCents(row.flowCents)} en el periodo
                        </span>
                      )}
                      <span>
                        {row.txCount}{" "}
                        {row.txCount === 1 ? "aportación" : "aportaciones"}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
