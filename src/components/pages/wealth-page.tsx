"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { loadBootstrap } from "@/lib/load-bootstrap";
import { QK } from "@/lib/query-keys";
import {
  approxPatrimonioAtMonthEnd,
  buildMonthlySnapshot,
  totalLiquidityCents,
} from "@/lib/finance/aggregates";
import { formatEuroFromCents } from "@/lib/finance/format";
import { monthNameEs, monthShortLabelEs } from "@/lib/finance/month-names";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YearMonth } from "@/types/finance";
import { getFinanceRepository } from "@/data";
import { toast } from "sonner";

export function WealthPage() {
  const { data, isPending } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const closeMonth = useMutation({
    mutationFn: async (ym: YearMonth) => {
      if (!data) return;
      const snap = buildMonthlySnapshot({
        year: ym.year,
        month: ym.month,
        txs: data.transactions,
        platforms: data.platforms,
        settings: data.settings,
      });
      await getFinanceRepository().upsertSnapshot(snap);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: QK.bootstrap });
      toast.success("Mes cerrado y snapshot guardado");
    },
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (let m = 1; m <= 12; m++) {
      const ym: YearMonth = { year, month: m };
      const txsUpTo = data.transactions.filter(
        (t) =>
          t.year < ym.year || (t.year === ym.year && t.month <= ym.month),
      );
      const liq = totalLiquidityCents(txsUpTo, data.platforms);
      const pat = approxPatrimonioAtMonthEnd(
        data.transactions,
        data.platforms,
        data.settings,
        ym,
      );
      const inv = Math.max(0, pat - liq);
      out.push({
        label: monthShortLabelEs(m),
        liquidez: liq,
        inversion: inv,
        patrimonio: pat,
      });
    }
    return out;
  }, [data, year]);

  if (isPending || !data) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patrimonio</h1>
          <p className="text-sm text-muted-foreground">
            Evolución mensual y cierre de mes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setYear((y) => y - 1)}>
            Año {year - 1}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setYear((y) => y + 1)}>
            Año {year + 1}
          </Button>
        </div>
      </header>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Evolución {year}</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="liq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="inv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(v) => `${Math.round(v / 100)}`} />
              <Tooltip
                formatter={(v) => formatEuroFromCents(Number(v ?? 0))}
                contentStyle={{
                  background: "#13131a",
                  border: "1px solid #1e1e2e",
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="liquidez"
                stackId="1"
                stroke="#6366f1"
                fill="url(#liq)"
                name="Liquidez"
                isAnimationActive
                animationDuration={700}
              />
              <Area
                type="monotone"
                dataKey="inversion"
                stackId="1"
                stroke="#10b981"
                fill="url(#inv)"
                name="Inversión (aprox.)"
                isAnimationActive
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Tabla mensual</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Mes</th>
                <th className="py-2 text-right">Liquidez</th>
                <th className="py-2 text-right">Inv. (aprox.)</th>
                <th className="py-2 text-right">Patrimonio</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, idx) => {
                const m = idx + 1;
                return (
                  <tr key={row.label} className="border-t border-border/40">
                    <td className="py-2 font-medium capitalize">{monthNameEs(m)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatEuroFromCents(row.liquidez)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatEuroFromCents(row.inversion)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatEuroFromCents(row.patrimonio)}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/resumen/mensual/${year}/${m}`}
                          className={cn(
                            buttonVariants({ variant: "secondary", size: "sm" }),
                          )}
                        >
                          Ver
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={closeMonth.isPending}
                          onClick={() => closeMonth.mutate({ year, month: m })}
                        >
                          Cerrar mes
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/resumen/anual/${year}`}
          className={cn(buttonVariants({ variant: "secondary" }), "rounded-xl")}
        >
          Resumen anual {year}
        </Link>
      </div>
    </div>
  );
}
