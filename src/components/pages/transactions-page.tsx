"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DynamicIcon } from "@/components/icons/dynamic-icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFinanceRepository } from "@/data";
import { QK } from "@/lib/query-keys";
import { loadBootstrap } from "@/lib/load-bootstrap";
import {
  formatDateEs,
  formatEuroFromCents,
  parseEuroInputToCents,
} from "@/lib/finance/format";
import { useTransactionFiltersStore } from "@/store/transaction-filters-store";
import { useTransactionSheetStore } from "@/store/transaction-sheet-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TransactionRow } from "@/types/finance";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function groupByDay(rows: TransactionRow[]) {
  const map = new Map<string, TransactionRow[]>();
  for (const t of rows) {
    const k = t.date;
    map.set(k, [...(map.get(k) ?? []), t]);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export function TransactionsPage() {
  const qc = useQueryClient();
  const tab = useTransactionFiltersStore((s) => s.tab);
  const setTab = useTransactionFiltersStore((s) => s.setTab);
  const openEdit = useTransactionSheetStore((s) => s.openEdit);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [platformId, setPlatformId] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TransactionRow | null>(null);

  const { data, isPending } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await getFinanceRepository().deleteTransaction(id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: QK.bootstrap });
      toast.success("Transacción eliminada");
      setPendingDelete(null);
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.transactions;
    if (tab !== "ALL") rows = rows.filter((t) => t.type === tab);
    rows = rows.filter((t) => t.year === year && t.month === month);
    if (platformId !== "all") rows = rows.filter((t) => t.platformId === platformId);
    if (categoryId !== "all") rows = rows.filter((t) => t.categoryId === categoryId);
    const minC = minAmount ? parseEuroInputToCents(minAmount) : null;
    const maxC = maxAmount ? parseEuroInputToCents(maxAmount) : null;
    if (minC != null) rows = rows.filter((t) => t.amountCents >= minC);
    if (maxC != null) rows = rows.filter((t) => t.amountCents <= maxC);
    return rows;
  }, [data, tab, year, month, platformId, categoryId, minAmount, maxAmount]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const categoryMeta = useMemo(() => {
    if (!data) return new Map<string, { name: string; color?: string; icon?: string }>();
    const m = new Map<string, { name: string; color?: string; icon?: string }>();
    for (const i of data.incomeTypes) m.set(i.id, { name: i.name });
    for (const e of data.expenseTypes)
      m.set(e.id, { name: e.name, color: e.color, icon: e.icon });
    for (const a of data.assetTypes)
      m.set(a.id, { name: a.name, color: a.color, icon: a.icon });
    return m;
  }, [data]);

  const platformById = useMemo(() => {
    if (!data) return new Map<string, string>();
    return new Map(data.platforms.map((p) => [p.id, p.name]));
  }, [data]);

  if (isPending || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Transacciones</h1>
        <p className="text-sm text-muted-foreground">
          Ingresos, gastos e inversiones en un solo listado.
        </p>
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 rounded-xl bg-muted/40 p-1">
          <TabsTrigger className="rounded-lg text-xs" value="ALL">
            Todos
          </TabsTrigger>
          <TabsTrigger className="rounded-lg text-xs" value="INCOME">
            Ingresos
          </TabsTrigger>
          <TabsTrigger className="rounded-lg text-xs" value="EXPENSE">
            Gastos
          </TabsTrigger>
          <TabsTrigger className="rounded-lg text-xs" value="INVESTMENT">
            Inversión
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="space-y-3 border-border/80 bg-card/60 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Año</p>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Mes</p>
            <Input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-xl"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-xs text-muted-foreground">Plataforma</p>
          <Select
            value={platformId}
            onValueChange={(v) => setPlatformId(v ?? "all")}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {data.platforms.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Importe mín (€)</p>
            <Input
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="rounded-xl"
              inputMode="decimal"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Importe máx (€)</p>
            <Input
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="rounded-xl"
              inputMode="decimal"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-xs text-muted-foreground">Categoría</p>
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v ?? "all")}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {data.incomeTypes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
              {data.expenseTypes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
              {data.assetTypes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="space-y-6">
        {grouped.length === 0 && (
          <Card className="border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
            No hay movimientos con estos filtros.
          </Card>
        )}
        {grouped.map(([day, txs]) => {
          const daily = txs.reduce((acc, t) => {
            if (t.type === "INCOME") return acc + t.amountCents;
            return acc - t.amountCents;
          }, 0);
          return (
            <section key={day} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-medium">{formatDateEs(day)}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Neto día:{" "}
                  <span className={daily >= 0 ? "text-success" : "text-destructive"}>
                    {daily >= 0 ? "+" : "−"}
                    {formatEuroFromCents(Math.abs(daily))}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                {txs.map((t) => {
                  const cat = categoryMeta.get(t.categoryId);
                  const sign =
                    t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "−" : "−";
                  const colorClass =
                    t.type === "INCOME"
                      ? "text-success"
                      : t.type === "EXPENSE"
                        ? "text-destructive"
                        : "text-warning";
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openEdit(t.id)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 text-left transition hover:bg-card"
                    >
                      <span
                        className="flex size-10 items-center justify-center rounded-xl bg-muted/40"
                        style={{
                          color: cat?.color ?? "#94a3b8",
                        }}
                      >
                        <DynamicIcon name={cat?.icon ?? "tag"} className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {t.description || cat?.name || "Sin descripción"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {platformById.get(t.platformId) ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold tabular-nums ${colorClass}`}>
                          {sign}
                          {formatEuroFromCents(t.amountCents)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(t);
                          }}
                        >
                          Borrar
                        </Button>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>¿Eliminar transacción?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={() => pendingDelete && del.mutate(pendingDelete.id)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
