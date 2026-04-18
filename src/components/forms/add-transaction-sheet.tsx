"use client";

import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/icons/dynamic-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getFinanceRepository } from "@/data";
import { QK } from "@/lib/query-keys";
import { parseEuroInputToCents } from "@/lib/finance/format";
import {
  firstDayOfMonthIso,
  formatYearMonthLongEs,
  monthNameEs,
} from "@/lib/finance/month-names";
import {
  assertCategoryMatchesType,
  normalizeTransactionRow,
} from "@/lib/finance/transaction-validation";
import { useTransactionSheetStore } from "@/store/transaction-sheet-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadBootstrap, type BootstrapData } from "@/lib/load-bootstrap";
import type { PlatformRow, TransactionType } from "@/types/finance";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function yearOptions(anchorYear: number): number[] {
  const from = Math.min(anchorYear - 6, new Date().getFullYear() - 10);
  const to = Math.max(anchorYear + 3, new Date().getFullYear() + 2);
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function platformsFor(
  type: TransactionType,
  platforms: PlatformRow[],
): PlatformRow[] {
  if (type === "INVESTMENT") {
    return platforms.filter((p) => p.type === "INVESTMENT" && p.active);
  }
  return platforms.filter((p) => p.type === "LIQUIDITY" && p.active);
}

function categoriesFor(type: TransactionType, data: BootstrapData) {
  if (type === "INCOME") return data.incomeTypes.filter((x) => x.active);
  if (type === "EXPENSE") return data.expenseTypes.filter((x) => x.active);
  return data.assetTypes.filter((x) => x.active);
}

function initialFormState(
  data: BootstrapData,
  mode: "create" | "edit",
  editId: string | null,
  defaultType: TransactionType,
) {
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  if (mode === "edit" && editId) {
    const tx = data.transactions.find((t) => t.id === editId);
    if (tx) {
      const type = tx.type;
      const pl = platformsFor(type, data.platforms);
      const platformId = pl.some((p) => p.id === tx.platformId)
        ? tx.platformId
        : (pl[0]?.id ?? "");
      const cats = categoriesFor(type, data);
      const categoryId = cats.some((c) => c.id === tx.categoryId)
        ? tx.categoryId
        : (cats[0]?.id ?? "");
      return {
        type,
        txYear: tx.year,
        txMonth: tx.month,
        amount: (tx.amountCents / 100).toFixed(2).replace(".", ","),
        description: tx.description,
        platformId,
        categoryId,
        unitPrice:
          tx.unitPriceCents != null
            ? String(tx.unitPriceCents / 100).replace(".", ",")
            : "",
      };
    }
  }
  const type = defaultType;
  const pl = platformsFor(type, data.platforms);
  const cats = categoriesFor(type, data);
  return {
    type,
    txYear: defaultYear,
    txMonth: defaultMonth,
    amount: "",
    description: "",
    platformId: pl[0]?.id ?? "",
    categoryId: cats[0]?.id ?? "",
    unitPrice: "",
  };
}

type FormInnerProps = {
  data: BootstrapData;
  mode: "create" | "edit";
  editId: string | null;
  defaultType: TransactionType;
  onClose: () => void;
};

function AddTransactionFormInner({
  data,
  mode,
  editId,
  defaultType,
  onClose,
}: FormInnerProps) {
  const qc = useQueryClient();
  const init = initialFormState(data, mode, editId, defaultType);
  const [type, setType] = useState<TransactionType>(() => init.type);
  const [txYear, setTxYear] = useState(() => init.txYear);
  const [txMonth, setTxMonth] = useState(() => init.txMonth);
  const [amount, setAmount] = useState(() => init.amount);
  const [description, setDescription] = useState(() => init.description);
  const [platformId, setPlatformId] = useState(() => init.platformId);
  const [categoryId, setCategoryId] = useState(() => init.categoryId);
  const [unitPrice, setUnitPrice] = useState(() => init.unitPrice);

  const years = useMemo(
    () => yearOptions(Math.max(txYear, data.settings.currentYear)),
    [txYear, data.settings.currentYear],
  );

  const buckets = useMemo(
    () => ({
      incomeIds: new Set(data.incomeTypes.map((i) => i.id)),
      expenseIds: new Set(data.expenseTypes.map((e) => e.id)),
      assetIds: new Set(data.assetTypes.map((a) => a.id)),
    }),
    [data],
  );

  const categories = useMemo(() => categoriesFor(type, data), [data, type]);

  const effectivePlatformId = useMemo(() => {
    const list = platformsFor(type, data.platforms);
    if (list.some((p) => p.id === platformId)) return platformId;
    return list[0]?.id ?? "";
  }, [data.platforms, platformId, type]);

  const effectiveCategoryId = useMemo(() => {
    if (categories.some((c) => c.id === categoryId)) return categoryId;
    return categories[0]?.id ?? "";
  }, [categories, categoryId]);

  const changeType = (value: TransactionType) => {
    setType(value);
    const pl = platformsFor(value, data.platforms);
    setPlatformId(pl[0]?.id ?? "");
    const cats = categoriesFor(value, data);
    setCategoryId(cats[0]?.id ?? "");
  };

  const save = useMutation({
    mutationFn: async () => {
      const cents = parseEuroInputToCents(amount);
      if (cents == null || cents <= 0) throw new Error("Importe no válido");
      assertCategoryMatchesType(type, effectiveCategoryId, buckets);
      const unitCents =
        type === "INVESTMENT" && unitPrice.trim()
          ? parseEuroInputToCents(unitPrice)
          : null;
      const id =
        mode === "edit" && editId
          ? editId
          : typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `tx-${Date.now()}`;
      const date = firstDayOfMonthIso(txYear, txMonth);
      const row = normalizeTransactionRow({
        id,
        date,
        month: txMonth,
        year: txYear,
        type,
        amountCents: cents,
        description: description.trim(),
        platformId: effectivePlatformId,
        categoryId: effectiveCategoryId,
        unitPriceCents: unitCents,
      });
      await getFinanceRepository().upsertTransaction(row);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: QK.bootstrap });
      toast.success(mode === "edit" ? "Transacción actualizada" : "Transacción creada");
      onClose();
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    },
  });

  return (
    <>
      <SheetHeader className="text-left">
        <SheetTitle>
          {mode === "edit" ? "Editar movimiento" : "Nuevo movimiento"}
        </SheetTitle>
      </SheetHeader>

      <div className="mt-4 flex flex-col gap-4 overflow-y-auto pb-4">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["INCOME", "Ingreso"],
              ["EXPENSE", "Gasto"],
              ["INVESTMENT", "Inversión"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={type === value ? "default" : "secondary"}
              className="rounded-xl"
              disabled={mode === "edit"}
              onClick={() => changeType(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="grid gap-2">
          <Label>Mes del movimiento</Label>
          <p className="text-xs text-muted-foreground">
            Se asigna al mes completo ({formatYearMonthLongEs(txYear, txMonth)}).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Mes</span>
              <Select
                value={String(txMonth)}
                onValueChange={(v) => setTxMonth(Number(v))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = i + 1;
                    return (
                      <SelectItem key={m} value={String(m)}>
                        {monthNameEs(m)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Año</span>
              <Select
                value={String(txYear)}
                onValueChange={(v) => setTxYear(Number(v))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Plataforma</Label>
          <div className="flex flex-wrap gap-2">
            {platformsFor(type, data.platforms).map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={effectivePlatformId === p.id ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setPlatformId(p.id)}
              >
                <DynamicIcon name={p.icon} className="mr-1 size-4" />
                {p.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Categoría</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {categories.map((c) => {
              const color =
                "color" in c && typeof c.color === "string" ? c.color : "#94a3b8";
              const icon =
                "icon" in c && typeof c.icon === "string" ? c.icon : "tag";
              const selected = effectiveCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-xs font-medium transition active:scale-[0.98]",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card/60 hover:bg-card",
                  )}
                >
                  <span
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <span style={{ color }}>
                      <DynamicIcon name={icon} className="size-5" />
                    </span>
                  </span>
                  <span className="line-clamp-2 leading-tight">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-primary/35 bg-primary/8 p-4 shadow-sm ring-offset-background">
          <Label htmlFor="tx-amount" className="text-base font-medium">
            Importe (€)
          </Label>
          <Input
            id="tx-amount"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-3 h-14 rounded-xl border-2 border-primary/25 bg-background/90 text-2xl font-semibold tabular-nums tracking-tight"
            autoComplete="off"
          />
        </div>

        {type === "INVESTMENT" && (
          <div className="grid gap-2">
            <Label htmlFor="tx-unit">Precio unitario (opcional)</Label>
            <Input
              id="tx-unit"
              inputMode="decimal"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="rounded-xl"
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="tx-desc">Descripción (opcional)</Label>
          <Input
            id="tx-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      <SheetFooter className="gap-2 sm:flex-col">
        <Button
          type="button"
          className="h-12 w-full rounded-2xl text-base"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          Guardar
        </Button>
      </SheetFooter>
    </>
  );
}

export function AddTransactionSheet() {
  const { open, close, mode, editId, defaultType } = useTransactionSheetStore();

  const { data } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] rounded-t-3xl border-border px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2"
      >
        {open && data && (
          <AddTransactionFormInner
            key={`${mode}-${editId ?? "new"}-${defaultType}`}
            data={data}
            mode={mode}
            editId={editId}
            defaultType={defaultType}
            onClose={close}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
