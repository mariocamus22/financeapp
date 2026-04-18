"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicIcon } from "@/components/icons/dynamic-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { loadBootstrap } from "@/lib/load-bootstrap";
import { QK } from "@/lib/query-keys";
import {
  investmentCapitalByAsset,
  investmentValueByAssetEstimate,
  totalsForPeriod,
} from "@/lib/finance/aggregates";
import { formatEuroFromCents } from "@/lib/finance/format";
import { roiAbsoluteCents, roiRatio } from "@/lib/finance/performance";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#6366f1", "#eab308", "#22c55e", "#a855f7", "#94a3b8"];

export function InvestmentsPage() {
  const { data, isPending } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const now = new Date();
  const year = now.getFullYear();

  const model = useMemo(() => {
    if (!data) return null;
    const cap = investmentCapitalByAsset(data.transactions, data.settings);
    const val = investmentValueByAssetEstimate({
      txs: data.transactions,
      snapshots: data.snapshots,
      settings: data.settings,
    });
    const rows = data.assetTypes.map((a, idx) => {
      const capital = cap[a.id] ?? 0;
      const value = val[a.id] ?? 0;
      const roi = roiRatio(value, capital);
      const abs = roiAbsoluteCents(value, capital);
      const months = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const slice = data.transactions.filter(
          (tx) =>
            tx.type === "INVESTMENT" &&
            tx.categoryId === a.id &&
            tx.year === year &&
            tx.month === m,
        );
        const real = slice.reduce((s, tx) => s + tx.amountCents, 0);
        return {
          m: String(m),
          real,
          target: a.monthlyTargetCents,
        };
      });
      return {
        asset: a,
        color: COLORS[idx % COLORS.length],
        capital,
        value,
        roi,
        abs,
        months,
      };
    });
    const totalCap = rows.reduce((s, r) => s + r.capital, 0);
    const totalVal = rows.reduce((s, r) => s + r.value, 0);
    const donut = rows.map((r) => ({
      name: r.asset.name,
      value: Math.max(0, r.value),
    }));
    const lineTotal = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const inv = totalsForPeriod(data.transactions, year, m).investmentCents;
      return { m: String(m), invertido: inv };
    });
    return { rows, totalCap, totalVal, donut, lineTotal };
  }, [data, year]);

  if (isPending || !data || !model) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const roiAbs = roiAbsoluteCents(model.totalVal, model.totalCap);
  const roiR = roiRatio(model.totalVal, model.totalCap);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Inversiones</h1>
        <p className="text-sm text-muted-foreground">
          Portfolio, aportaciones y rentabilidad por activo.
        </p>
      </header>

      <Card className="border-border/80 bg-card/60">
        <CardContent className="grid gap-3 p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Valor total</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatEuroFromCents(model.totalVal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Capital invertido</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatEuroFromCents(model.totalCap)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rentabilidad</p>
            <p
              className={
                roiAbs >= 0
                  ? "text-xl font-semibold text-success tabular-nums"
                  : "text-xl font-semibold text-destructive tabular-nums"
              }
            >
              {roiAbs >= 0 ? "+" : ""}
              {formatEuroFromCents(roiAbs)}
              {roiR != null && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({(roiR * 100).toFixed(2)}%)
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-border/80 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Distribución</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={model.donut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  isAnimationActive
                  animationDuration={700}
                >
                  {model.donut.map((_, i) => (
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
            <CardTitle className="text-base">Inversión mensual ({year})</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={model.lineTotal}>
                <XAxis dataKey="m" stroke="#64748b" />
                <YAxis hide />
                <Tooltip formatter={(v) => formatEuroFromCents(Number(v ?? 0))} />
                <Line
                  type="monotone"
                  dataKey="invertido"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={700}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {model.rows.map((r) => {
          const expanded = openId === r.asset.id;
          return (
            <Card key={r.asset.id} className="border-border/80 bg-card/60">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setOpenId(expanded ? null : r.asset.id)}
              >
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                  <span
                    className="flex size-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${r.asset.color}22` }}
                  >
                    <span style={{ color: r.asset.color }}>
                      <DynamicIcon name={r.asset.icon} className="size-6" />
                    </span>
                  </span>
                  <div className="flex-1">
                    <CardTitle className="text-base">{r.asset.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Objetivo mensual: {formatEuroFromCents(r.asset.monthlyTargetCents)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatEuroFromCents(r.value)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Capital</span>
                    <span className="tabular-nums">{formatEuroFromCents(r.capital)}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Rentabilidad</span>
                    <span
                      className={
                        r.abs >= 0 ? "text-success tabular-nums" : "text-destructive tabular-nums"
                      }
                    >
                      {r.abs >= 0 ? "+" : ""}
                      {formatEuroFromCents(r.abs)}
                      {r.roi != null && (
                        <span className="ml-2 text-muted-foreground">
                          ({(r.roi * 100).toFixed(2)}%)
                        </span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-border/40"
                  >
                    <div className="h-56 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={r.months}>
                          <XAxis dataKey="m" stroke="#64748b" />
                          <YAxis hide />
                          <Tooltip formatter={(v) => formatEuroFromCents(Number(v ?? 0))} />
                          <Legend />
                          <Bar dataKey="real" name="Real" fill="#6366f1" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="target" name="Objetivo" fill="#64748b" opacity={0.35} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Objetivos de inversión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.goals
            .filter((g) => g.active && (g.type === "INVESTMENT" || g.type === "ASSET"))
            .map((g) => (
              <div key={g.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{g.name}</span>
                  <span className="text-muted-foreground">
                    Meta {g.targetYear}: {formatEuroFromCents(g.targetAmountCents)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        (model.totalVal / Math.max(1, g.targetAmountCents)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
