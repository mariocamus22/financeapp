"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadBootstrap } from "@/lib/load-bootstrap";
import { QK } from "@/lib/query-keys";
import {
  totalsForPeriod,
  transactionsInPeriod,
  yearSavingsRunning,
} from "@/lib/finance/aggregates";
import { formatEuroFromCents } from "@/lib/finance/format";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

function clampMonth(y: number, m: number) {
  if (m < 1) return { year: y - 1, month: 12 };
  if (m > 12) return { year: y + 1, month: 1 };
  return { year: y, month: m };
}

export function BudgetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isPending } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });

  const shift = (delta: number) => {
    const nm = month + delta;
    const { year: ny, month: nm2 } = clampMonth(year, nm);
    setYear(ny);
    setMonth(nm2);
  };

  const incomeRows = useMemo(() => {
    if (!data) return [];
    const txs = transactionsInPeriod(data.transactions, year, month).filter(
      (t) => t.type === "INCOME",
    );
    return data.incomeTypes.map((it) => {
      const real = txs
        .filter((t) => t.categoryId === it.id)
        .reduce((a, t) => a + t.amountCents, 0);
      return { id: it.id, name: it.name, budget: 0, real };
    });
  }, [data, year, month]);

  const expenseRows = useMemo(() => {
    if (!data) return [];
    const txs = transactionsInPeriod(data.transactions, year, month).filter(
      (t) => t.type === "EXPENSE",
    );
    return data.expenseTypes.map((et) => {
      const real = txs
        .filter((t) => t.categoryId === et.id)
        .reduce((a, t) => a + t.amountCents, 0);
      return {
        id: et.id,
        name: et.name,
        budget: et.monthlyBudgetCents,
        real,
      };
    });
  }, [data, year, month]);

  const investRows = useMemo(() => {
    if (!data) return [];
    const txs = transactionsInPeriod(data.transactions, year, month).filter(
      (t) => t.type === "INVESTMENT",
    );
    return data.assetTypes.map((at) => {
      const real = txs
        .filter((t) => t.categoryId === at.id)
        .reduce((a, t) => a + t.amountCents, 0);
      return {
        id: at.id,
        name: at.name,
        budget: at.monthlyTargetCents,
        real,
      };
    });
  }, [data, year, month]);

  const totals = useMemo(() => {
    if (!data) return null;
    return totalsForPeriod(data.transactions, year, month);
  }, [data, year, month]);

  const ytd = useMemo(() => {
    if (!data) return 0;
    const running = yearSavingsRunning(data.transactions, year);
    return running[month] ?? 0;
  }, [data, year, month]);

  if (isPending || !data || !totals) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  const saving =
    totals.incomeCents - totals.expenseCents - totals.investmentCents;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Presupuesto</h1>
        <p className="text-sm text-muted-foreground">
          Objetivos vs realidad por categoría.
        </p>
      </header>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-2 py-2">
        <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Mes anterior">
          <ChevronLeft className="size-5" />
        </Button>
        <p className="text-sm font-medium tabular-nums">
          {String(month).padStart(2, "0")}/{year}
        </p>
        <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Mes siguiente">
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <Tabs defaultValue="mes">
        <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/40 p-1">
          <TabsTrigger className="rounded-lg" value="mes">
            Mes
          </TabsTrigger>
          <TabsTrigger className="rounded-lg" value="anio">
            Año
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mes" className="space-y-4 pt-2">
          <Card className="border-border/80 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Ingresos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {incomeRows.map((r) => (
                <div key={r.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{r.name}</span>
                  <span className="tabular-nums">{formatEuroFromCents(r.real)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Gastos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenseRows.map((r) => {
                const pct = r.budget > 0 ? Math.min(1.4, r.real / r.budget) : r.real > 0 ? 1 : 0;
                const ok = r.budget === 0 ? r.real === 0 : r.real <= r.budget;
                return (
                  <div key={r.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{r.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatEuroFromCents(r.real)} / {formatEuroFromCents(r.budget)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                      <motion.div
                        className={
                          ok ? "h-full rounded-full bg-success" : "h-full rounded-full bg-destructive"
                        }
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, pct * 100)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Inversión (aportaciones)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {investRows.map((r) => {
                const pct =
                  r.budget > 0 ? Math.min(1.4, r.real / r.budget) : r.real > 0 ? 1 : 0;
                const ok = r.budget === 0 ? true : r.real >= r.budget * 0.9;
                return (
                  <div key={r.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{r.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatEuroFromCents(r.real)} / {formatEuroFromCents(r.budget)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                      <motion.div
                        className={
                          ok ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-warning"
                        }
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, pct * 100)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">Ahorro mensual</p>
              <p
                className={
                  saving >= 0
                    ? "text-3xl font-semibold text-success tabular-nums"
                    : "text-3xl font-semibold text-destructive tabular-nums"
                }
              >
                {formatEuroFromCents(saving)}
              </p>
              <p className="text-xs text-muted-foreground">
                Ahorro acumulado en el año (hasta este mes):{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatEuroFromCents(ytd)}
                </span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="anio" className="pt-2">
          <AnnualMatrix year={year} onYearChange={setYear} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnnualMatrix({
  year,
  onYearChange,
}: {
  year: number;
  onYearChange: (y: number) => void;
}) {
  const { data } = useQuery({ queryKey: QK.bootstrap, queryFn: loadBootstrap });
  const rows = useMemo(() => {
    if (!data) return [];
    const keys: { id: string; name: string; kind: "EXPENSE" | "INCOME" | "INV" }[] = [];
    for (const i of data.incomeTypes)
      keys.push({ id: i.id, name: i.name, kind: "INCOME" });
    for (const e of data.expenseTypes)
      keys.push({ id: e.id, name: e.name, kind: "EXPENSE" });
    for (const a of data.assetTypes)
      keys.push({ id: a.id, name: a.name, kind: "INV" });
    return keys.map((k) => ({
      ...k,
      months: Array.from({ length: 12 }, (_, idx) => {
        const m = idx + 1;
        const slice = data.transactions.filter(
          (t) =>
            t.year === year &&
            t.month === m &&
            t.categoryId === k.id &&
            ((k.kind === "INCOME" && t.type === "INCOME") ||
              (k.kind === "EXPENSE" && t.type === "EXPENSE") ||
              (k.kind === "INV" && t.type === "INVESTMENT")),
        );
        return slice.reduce((a, t) => a + t.amountCents, 0);
      }),
    }));
  }, [data, year]);

  if (!data) return <Skeleton className="h-60 w-full rounded-2xl" />;

  return (
    <Card className="border-border/80 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Matriz anual {year}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => onYearChange(year - 1)}>
            −
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onYearChange(year + 1)}>
            +
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="sticky left-0 bg-card/95 px-2 py-2">Categoría</th>
              {Array.from({ length: 12 }, (_, i) => (
                <th key={i} className="px-1 py-2 text-right">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/40">
                <td className="sticky left-0 bg-card/95 px-2 py-2 font-medium">{r.name}</td>
                {r.months.map((c, idx) => (
                  <td key={idx} className="px-1 py-2 text-right tabular-nums text-muted-foreground">
                    {c === 0 ? "–" : formatEuroFromCents(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
