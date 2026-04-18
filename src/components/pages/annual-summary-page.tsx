"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { loadBootstrap } from "@/lib/load-bootstrap";
import { QK } from "@/lib/query-keys";
import {
  approxPatrimonioAtMonthEnd,
  totalsForPeriod,
} from "@/lib/finance/aggregates";
import { formatEuroFromCents } from "@/lib/finance/format";
import { monthNameEs, monthShortLabelEs } from "@/lib/finance/month-names";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

export function AnnualSummaryPage({ year }: { year: number }) {
  const { data, isPending } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });

  const model = useMemo(() => {
    if (!data) return null;
    let incomeY = 0;
    let expenseY = 0;
    let invY = 0;
    const months = [];
    let maxExpenseCat = { name: "-", amount: 0 };
    const expenseByCat: Record<string, number> = {};
    let maxMonth = 1;
    let minMonth = 1;
    let maxSpend = 0;
    let minSpend = Number.POSITIVE_INFINITY;

    for (let m = 1; m <= 12; m++) {
      const t = totalsForPeriod(data.transactions, year, m);
      incomeY += t.incomeCents;
      expenseY += t.expenseCents;
      invY += t.investmentCents;
      months.push({
        mes: monthShortLabelEs(m),
        ingresos: t.incomeCents,
        gastos: t.expenseCents,
        inversion: t.investmentCents,
      });
      const spend = t.expenseCents;
      if (spend > maxSpend) {
        maxSpend = spend;
        maxMonth = m;
      }
      if (spend < minSpend) {
        minSpend = spend;
        minMonth = m;
      }
      const txs = data.transactions.filter(
        (tx) => tx.year === year && tx.month === m && tx.type === "EXPENSE",
      );
      for (const tx of txs) {
        expenseByCat[tx.categoryId] = (expenseByCat[tx.categoryId] ?? 0) + tx.amountCents;
      }
    }

    for (const [id, amount] of Object.entries(expenseByCat)) {
      if (amount > maxExpenseCat.amount) {
        const name = data.expenseTypes.find((e) => e.id === id)?.name ?? id;
        maxExpenseCat = { name, amount };
      }
    }

    const patSeries = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const pat = approxPatrimonioAtMonthEnd(
        data.transactions,
        data.platforms,
        data.settings,
        { year, month: m },
      );
      return { mes: monthShortLabelEs(m), patrimonio: pat };
    });

    return {
      incomeY,
      expenseY,
      invY,
      months,
      maxExpenseCat,
      maxMonth,
      minMonth,
      maxSpend,
      minSpend: Number.isFinite(minSpend) ? minSpend : 0,
      patSeries,
    };
  }, [data, year]);

  if (isPending || !data || !model) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Resumen anual {year}</h1>
        <p className="text-sm text-muted-foreground">Vista macro</p>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Card className="border-border/80 bg-card/60">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatEuroFromCents(model.incomeY)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/60">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatEuroFromCents(model.expenseY)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/60">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-muted-foreground">Invertido</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatEuroFromCents(model.invY)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Ingresos / Gastos / Inversión por mes</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={model.months}>
              <XAxis dataKey="mes" stroke="#64748b" />
              <YAxis hide />
              <Tooltip formatter={(v) => formatEuroFromCents(Number(v ?? 0))} />
              <Legend />
              <Bar dataKey="ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
              <Bar dataKey="inversion" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Patrimonio a cierre de cada mes</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={model.patSeries}>
              <XAxis dataKey="mes" stroke="#64748b" />
              <YAxis hide />
              <Tooltip formatter={(v) => formatEuroFromCents(Number(v ?? 0))} />
              <Area
                type="monotone"
                dataKey="patrimonio"
                stroke="#6366f1"
                fill="#6366f133"
                isAnimationActive
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Categoría de gasto más grande:{" "}
            <span className="font-medium text-foreground">{model.maxExpenseCat.name}</span> (
            {formatEuroFromCents(model.maxExpenseCat.amount)})
          </p>
          <p>
            Mes con mayor gasto:{" "}
            <span className="font-medium text-foreground capitalize">
              {monthNameEs(model.maxMonth)}
            </span>{" "}
            ({formatEuroFromCents(model.maxSpend)})
          </p>
          <p>
            Mes con menor gasto:{" "}
            <span className="font-medium text-foreground capitalize">
              {monthNameEs(model.minMonth)}
            </span>{" "}
            ({formatEuroFromCents(model.minSpend)})
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
