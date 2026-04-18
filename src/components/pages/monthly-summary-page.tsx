"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getFinanceRepository } from "@/data";
import { loadBootstrap } from "@/lib/load-bootstrap";
import { QK } from "@/lib/query-keys";
import {
  approxPatrimonioAtMonthEnd,
  liquidityBalancesByPlatform,
  investmentCapitalByAsset,
  investmentValueByAssetEstimate,
  totalsForPeriod,
  transactionsInPeriod,
} from "@/lib/finance/aggregates";
import { formatDateEs, formatEuroFromCents } from "@/lib/finance/format";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4"];

export function MonthlySummaryPage({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const { data, isPending } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });

  const body = useMemo(() => {
    if (!data) return null;
    const txs = data.transactions;
    const totals = totalsForPeriod(txs, year, month);
    const saving =
      totals.incomeCents - totals.expenseCents - totals.investmentCents;
    const ym = { year, month };
    const txsMonth = transactionsInPeriod(txs, year, month);
    const liqMap = liquidityBalancesByPlatform(
      txs.filter(
        (t) =>
          t.year < ym.year || (t.year === ym.year && t.month <= ym.month),
      ),
      data.platforms,
    );
    const cap = investmentCapitalByAsset(
      txs.filter(
        (t) =>
          t.year < ym.year || (t.year === ym.year && t.month <= ym.month),
      ),
      data.settings,
    );
    const val = investmentValueByAssetEstimate({
      txs,
      snapshots: data.snapshots,
      settings: data.settings,
    });
    const pat = approxPatrimonioAtMonthEnd(txs, data.platforms, data.settings, ym);

    const liqPie = Object.entries(liqMap)
      .map(([id, amount]) => ({
        name: data.platforms.find((p) => p.id === id)?.name ?? id,
        value: Math.max(0, amount),
      }))
      .filter((x) => x.value > 0);

    const invPie = data.assetTypes.map((a) => ({
      name: a.name,
      value: Math.max(0, val[a.id] ?? 0),
    }));

    const donut = [
      ...liqPie.map((x) => ({ name: `Liq: ${x.name}`, value: x.value })),
      ...invPie.map((x) => ({ name: `Inv: ${x.name}`, value: x.value })),
    ].filter((x) => x.value > 0);

    return { totals, saving, liqMap, cap, val, pat, txsMonth, donut };
  }, [data, year, month]);

  if (isPending || !data) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }
  if (!body) return null;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Resumen {String(month).padStart(2, "0")}/{year}
        </h1>
        <p className="text-sm text-muted-foreground">Extracto mensual</p>
      </header>

      <Card className="border-border/80 bg-card/60">
        <CardContent className="space-y-2 p-6">
          <p className="text-sm text-muted-foreground">Patrimonio (aprox. a cierre)</p>
          <p className="text-4xl font-semibold tabular-nums">
            {formatEuroFromCents(body.pat)}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Ingresos" value={body.totals.incomeCents} />
        <Kpi label="Gastos" value={body.totals.expenseCents} />
        <Kpi label="Invertido" value={body.totals.investmentCents} />
        <Kpi label="Ahorro neto" value={body.saving} highlight />
      </div>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Liquidez por plataforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.entries(body.liqMap).map(([id, amount]) => (
            <div key={id} className="flex justify-between gap-2">
              <span className="text-muted-foreground">
                {data.platforms.find((p) => p.id === id)?.name ?? id}
              </span>
              <span className="tabular-nums">{formatEuroFromCents(amount)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Inversiones por activo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.assetTypes.map((a) => (
            <div key={a.id} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{a.name}</span>
              <span className="tabular-nums text-right">
                V: {formatEuroFromCents(body.val[a.id] ?? 0)} · C:{" "}
                {formatEuroFromCents(body.cap[a.id] ?? 0)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Distribución del patrimonio</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={body.donut}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                isAnimationActive
                animationDuration={700}
              >
                {body.donut.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatEuroFromCents(Number(v ?? 0))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Línea de tiempo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {body.txsMonth
            .slice()
            .sort((a, b) => (a.date < b.date ? -1 : 1))
            .map((t) => (
              <div key={t.id} className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{formatDateEs(t.date)}</span>
                <span className="tabular-nums">{formatEuroFromCents(t.amountCents)}</span>
              </div>
            ))}
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={async () => {
          try {
            const bundle = await getFinanceRepository().exportAll();
            const blob = new Blob([JSON.stringify(bundle, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `resumen-${year}-${month}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Export JSON generado");
          } catch {
            toast.error("No se pudo exportar");
          }
        }}
      >
        Exportar datos (JSON)
      </Button>
    </div>
  );
}

function Kpi({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className="border-border/80 bg-card/60">
      <CardContent className="space-y-1 p-4">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p
          className={
            highlight
              ? value >= 0
                ? "text-sm font-semibold text-success tabular-nums"
                : "text-sm font-semibold text-destructive tabular-nums"
              : "text-sm font-semibold tabular-nums"
          }
        >
          {formatEuroFromCents(value)}
        </p>
      </CardContent>
    </Card>
  );
}
