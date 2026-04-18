"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { QK } from "@/lib/query-keys";
import { loadBootstrap } from "@/lib/load-bootstrap";
import {
  approxPatrimonioAtMonthEnd,
  investmentCapitalByAsset,
  investmentValueByAssetEstimate,
  lastNClosedMonths,
  totalsForPeriod,
  totalLiquidityCents,
} from "@/lib/finance/aggregates";
import { formatEuroFromCents } from "@/lib/finance/format";
import { roiAbsoluteCents, roiRatio } from "@/lib/finance/performance";
import { useQuery } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YearMonth } from "@/types/finance";

function monthLabel(ym: YearMonth) {
  return `${String(ym.month).padStart(2, "0")}/${String(ym.year).slice(2)}`;
}

export function DashboardHome() {
  const { data, isPending } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });

  if (isPending || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const { transactions, platforms, settings, snapshots } = data;
  const now = new Date();
  const anchor: YearMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const prev: YearMonth =
    anchor.month === 1
      ? { year: anchor.year - 1, month: 12 }
      : { year: anchor.year, month: anchor.month - 1 };

  const liq = totalLiquidityCents(transactions, platforms);
  const capitalBy = investmentCapitalByAsset(transactions, settings);
  const valueBy = investmentValueByAssetEstimate({
    txs: transactions,
    snapshots,
    settings,
  });
  const capitalTotal = Object.values(capitalBy).reduce((a, b) => a + b, 0);
  const valueTotal = Object.values(valueBy).reduce((a, b) => a + b, 0);
  const patrimonio = liq + valueTotal;
  const patPrev = approxPatrimonioAtMonthEnd(
    transactions,
    platforms,
    settings,
    prev,
  );
  const delta = patrimonio - patPrev;
  const deltaPct = patPrev !== 0 ? delta / patPrev : null;

  const roiAbs = roiAbsoluteCents(valueTotal, capitalTotal);
  const roiR = roiRatio(valueTotal, capitalTotal);

  const monthTotals = totalsForPeriod(
    transactions,
    anchor.year,
    anchor.month,
  );
  const saving =
    monthTotals.incomeCents -
    monthTotals.expenseCents -
    monthTotals.investmentCents;

  const monthsAsc = [...lastNClosedMonths(anchor, 6)].reverse();
  const spark = monthsAsc.map((ym) => ({
    label: monthLabel(ym),
    patrimonio: approxPatrimonioAtMonthEnd(
      transactions,
      platforms,
      settings,
      ym,
    ),
  }));

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Patrimonio total
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-4xl font-semibold tracking-tight tabular-nums">
            <AnimatedNumber
              value={patrimonio}
              format={(n) => formatEuroFromCents(Math.round(n))}
            />
          </div>
          <div
            className={
              delta >= 0 ? "text-sm text-success" : "text-sm text-destructive"
            }
          >
            {delta >= 0 ? "+" : ""}
            {formatEuroFromCents(delta)}
            {deltaPct != null && (
              <span className="text-muted-foreground">
                {" "}
                ({(deltaPct * 100).toFixed(1)}% vs mes anterior)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border/80 bg-card/60">
          <CardContent className="space-y-1 p-4">
            <p className="text-[11px] text-muted-foreground">Liquidez</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatEuroFromCents(liq)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/60">
          <CardContent className="space-y-1 p-4">
            <p className="text-[11px] text-muted-foreground">Capital inv.</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatEuroFromCents(capitalTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/60">
          <CardContent className="space-y-1 p-4">
            <p className="text-[11px] text-muted-foreground">Valor inv.</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatEuroFromCents(valueTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Rentabilidad global</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-baseline gap-3">
          <span
            className={
              roiAbs >= 0 ? "text-2xl font-semibold text-success" : "text-2xl font-semibold text-destructive"
            }
          >
            {roiAbs >= 0 ? "+" : ""}
            {formatEuroFromCents(roiAbs)}
          </span>
          {roiR != null && (
            <span
              className={
                roiR >= 0 ? "text-sm text-success" : "text-sm text-destructive"
              }
            >
              {(roiR * 100).toFixed(2)}%
            </span>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium">Evolución (6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-28 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                formatter={(v) => formatEuroFromCents(Number(v ?? 0))}
                contentStyle={{
                  background: "#13131a",
                  border: "1px solid #1e1e2e",
                  borderRadius: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="patrimonio"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Mes actual ({monthLabel(anchor)})
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Ingresos</p>
            <p className="font-semibold tabular-nums">
              {formatEuroFromCents(monthTotals.incomeCents)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Gastos</p>
            <p className="font-semibold tabular-nums">
              {formatEuroFromCents(monthTotals.expenseCents)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Inversión</p>
            <p className="font-semibold tabular-nums">
              {formatEuroFromCents(monthTotals.investmentCents)}
            </p>
          </div>
          <div className="col-span-3 mt-2 rounded-xl border border-border/60 bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">Ahorro neto del mes</p>
            <p
              className={
                saving >= 0
                  ? "text-xl font-semibold text-success tabular-nums"
                  : "text-xl font-semibold text-destructive tabular-nums"
              }
            >
              {formatEuroFromCents(saving)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
