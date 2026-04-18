"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupabaseAccountPanel } from "@/components/settings/supabase-account-panel";
import { getFinanceRepository } from "@/data";
import { loadBootstrap } from "@/lib/load-bootstrap";
import { QK } from "@/lib/query-keys";
import { parseEuroInputToCents, formatEuroFromCents } from "@/lib/finance/format";
import { totalLiquidityCents } from "@/lib/finance/aggregates";
import type { ExportBundleV1 } from "@/types/finance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function SettingsPage() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: QK.bootstrap,
    queryFn: loadBootstrap,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: QK.bootstrap });

  const importJson = useMutation({
    mutationFn: async (text: string) => {
      const parsed = JSON.parse(text) as ExportBundleV1;
      await getFinanceRepository().importAll(parsed);
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Importación completada");
    },
    onError: () => toast.error("JSON inválido"),
  });

  if (isPending || !data) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  const liq = totalLiquidityCents(data.transactions, data.platforms);
  const ef = data.settings.emergencyFundTargetCents;
  const efPct = ef > 0 ? Math.min(1, liq / ef) : 0;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Personaliza tu app.</p>
      </header>

      <Tabs defaultValue="general">
        <TabsList className="flex w-full flex-wrap rounded-xl bg-muted/40 p-1">
          <TabsTrigger value="general" className="rounded-lg text-xs">
            General
          </TabsTrigger>
          <TabsTrigger value="platforms" className="rounded-lg text-xs">
            Plataformas
          </TabsTrigger>
          <TabsTrigger value="assets" className="rounded-lg text-xs">
            Activos
          </TabsTrigger>
          <TabsTrigger value="income" className="rounded-lg text-xs">
            Ingresos
          </TabsTrigger>
          <TabsTrigger value="expense" className="rounded-lg text-xs">
            Gastos
          </TabsTrigger>
          <TabsTrigger value="goals" className="rounded-lg text-xs">
            Objetivos
          </TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg text-xs">
            Datos
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg text-xs">
            Cuenta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-3">
          <Card className="border-border/80 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Fondo de emergencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Liquidez actual:{" "}
                <span className="font-medium text-foreground">{formatEuroFromCents(liq)}</span>
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${efPct * 100}%` }}
                />
              </div>
              <GeneralYearForm settings={data.settings} onSaved={refresh} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="pt-3">
          <PlatformsEditor platforms={data.platforms} onChanged={refresh} />
        </TabsContent>

        <TabsContent value="assets" className="pt-3">
          <AssetTypesEditor
            assetTypes={data.assetTypes}
            settings={data.settings}
            onChanged={refresh}
          />
        </TabsContent>

        <TabsContent value="income" className="pt-3">
          <SimpleListEditor title="Tipos de ingreso" rows={data.incomeTypes} onChanged={refresh} />
        </TabsContent>

        <TabsContent value="expense" className="pt-3">
          <ExpenseTypesEditor expenseTypes={data.expenseTypes} onChanged={refresh} />
        </TabsContent>

        <TabsContent value="goals" className="pt-3">
          <GoalsEditor goals={data.goals} onChanged={refresh} />
        </TabsContent>

        <TabsContent value="data" className="space-y-3 pt-3">
          <Card className="border-border/80 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Exportar / importar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                onClick={async () => {
                  const bundle = await getFinanceRepository().exportAll();
                  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Descargar JSON
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => fileRef.current?.click()}
              >
                Importar JSON
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const text = await f.text();
                  importJson.mutate(text);
                  e.target.value = "";
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-3 pt-3">
          <SupabaseAccountPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralYearForm({
  settings,
  onSaved,
}: {
  settings: import("@/types/finance").SettingsRow;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [target, setTarget] = useState(String(settings.emergencyFundTargetCents / 100));
  const [year, setYear] = useState(String(settings.currentYear));

  const save = useMutation({
    mutationFn: async () => {
      const cents = parseEuroInputToCents(target);
      if (cents == null) throw new Error("Objetivo inválido");
      const y = Number(year);
      if (!Number.isFinite(y)) throw new Error("Año inválido");
      await getFinanceRepository().upsertSettings({
        ...settings,
        emergencyFundTargetCents: cents,
        currentYear: y,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: QK.bootstrap });
      toast.success("Ajustes guardados");
      onSaved();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label>Objetivo fondo emergencia (€)</Label>
        <Input value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-xl" />
      </div>
      <div className="grid gap-2">
        <Label>Año activo</Label>
        <Input value={year} onChange={(e) => setYear(e.target.value)} className="rounded-xl" />
      </div>
      <Button type="button" className="rounded-xl" onClick={() => save.mutate()}>
        Guardar
      </Button>
    </div>
  );
}

function PlatformsEditor({
  platforms,
  onChanged,
}: {
  platforms: import("@/types/finance").PlatformRow[];
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const ordered = [...platforms].sort((a, b) => a.sortOrder - b.sortOrder);

  const saveRow = async (row: import("@/types/finance").PlatformRow) => {
    await getFinanceRepository().upsertPlatform(row);
    await qc.invalidateQueries({ queryKey: QK.bootstrap });
    toast.success("Plataforma guardada");
    onChanged();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar plataforma?")) return;
    await getFinanceRepository().deletePlatform(id);
    await qc.invalidateQueries({ queryKey: QK.bootstrap });
    toast.success("Eliminada");
    onChanged();
  };

  const add = async () => {
    const id = crypto.randomUUID();
    const nextOrder = Math.max(0, ...ordered.map((p) => p.sortOrder)) + 1;
    const row: import("@/types/finance").PlatformRow = {
      id,
      name: "Nueva plataforma",
      type: "LIQUIDITY",
      color: "#6366f1",
      icon: "landmark",
      sortOrder: nextOrder,
      active: true,
    };
    await getFinanceRepository().upsertPlatform(row);
    await qc.invalidateQueries({ queryKey: QK.bootstrap });
    onChanged();
  };

  return (
    <div className="space-y-3">
      {ordered.map((p) => (
          <Card key={p.id} className="border-border/80 bg-card/60">
            <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Nombre</Label>
                <Input
                  defaultValue={p.name}
                  onBlur={(e) => saveRow({ ...p, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <select
                  className="border-input bg-background h-10 rounded-xl border px-3 text-sm"
                  defaultValue={p.type}
                  onChange={(e) =>
                    saveRow({
                      ...p,
                      type: e.target.value as import("@/types/finance").PlatformRow["type"],
                    })
                  }
                >
                  <option value="LIQUIDITY">Liquidez</option>
                  <option value="INVESTMENT">Inversión</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Color (hex)</Label>
                <Input
                  defaultValue={p.color}
                  onBlur={(e) => saveRow({ ...p, color: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Icono (lucide)</Label>
                <Input
                  defaultValue={p.icon}
                  onBlur={(e) => saveRow({ ...p, icon: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    defaultChecked={p.active}
                    onChange={(e) => saveRow({ ...p, active: e.target.checked })}
                  />
                  Activa
                </label>
                <Button type="button" variant="destructive" size="sm" onClick={() => remove(p.id)}>
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      <Button type="button" variant="secondary" className="rounded-xl" onClick={add}>
        Añadir plataforma
      </Button>
    </div>
  );
}

function AssetTypesEditor({
  assetTypes,
  settings,
  onChanged,
}: {
  assetTypes: import("@/types/finance").AssetTypeRow[];
  settings: import("@/types/finance").SettingsRow;
  onChanged: () => void;
}) {
  const qc = useQueryClient();

  const saveAsset = async (row: import("@/types/finance").AssetTypeRow) => {
    await getFinanceRepository().upsertAssetType(row);
    await qc.invalidateQueries({ queryKey: QK.bootstrap });
    toast.success("Activo actualizado");
    onChanged();
  };

  const savePrevCapital = async (assetId: string, euros: string) => {
    const cents = parseEuroInputToCents(euros);
    if (cents == null) return;
    await getFinanceRepository().upsertSettings({
      ...settings,
      previousCapitalByAsset: {
        ...settings.previousCapitalByAsset,
        [assetId]: cents,
      },
    });
    await qc.invalidateQueries({ queryKey: QK.bootstrap });
    toast.success("Capital previo guardado");
    onChanged();
  };

  return (
    <div className="space-y-3">
      {assetTypes.map((a) => (
        <Card key={a.id} className="border-border/80 bg-card/60">
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                defaultValue={a.name}
                onBlur={(e) => saveAsset({ ...a, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label>Objetivo mensual (€)</Label>
              <Input
                defaultValue={String(a.monthlyTargetCents / 100)}
                onBlur={(e) => {
                  const c = parseEuroInputToCents(e.target.value);
                  if (c == null) return;
                  saveAsset({ ...a, monthlyTargetCents: c });
                }}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <Input
                defaultValue={a.color}
                onBlur={(e) => saveAsset({ ...a, color: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label>Icono</Label>
              <Input
                defaultValue={a.icon}
                onBlur={(e) => saveAsset({ ...a, icon: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Capital invertido antes del primer mes (€)</Label>
              <Input
                defaultValue={String((settings.previousCapitalByAsset[a.id] ?? 0) / 100)}
                onBlur={(e) => savePrevCapital(a.id, e.target.value)}
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExpenseTypesEditor({
  expenseTypes,
  onChanged,
}: {
  expenseTypes: import("@/types/finance").ExpenseTypeRow[];
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const save = async (row: import("@/types/finance").ExpenseTypeRow) => {
    await getFinanceRepository().upsertExpenseType(row);
    await qc.invalidateQueries({ queryKey: QK.bootstrap });
    toast.success("Categoría guardada");
    onChanged();
  };
  return (
    <div className="space-y-3">
      {expenseTypes.map((e) => (
        <Card key={e.id} className="border-border/80 bg-card/60">
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input defaultValue={e.name} onBlur={(ev) => save({ ...e, name: ev.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Presupuesto mensual (€)</Label>
              <Input
                defaultValue={String(e.monthlyBudgetCents / 100)}
                onBlur={(ev) => {
                  const c = parseEuroInputToCents(ev.target.value);
                  if (c == null) return;
                  save({ ...e, monthlyBudgetCents: c });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <Input defaultValue={e.color} onBlur={(ev) => save({ ...e, color: ev.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Icono</Label>
              <Input defaultValue={e.icon} onBlur={(ev) => save({ ...e, icon: ev.target.value })} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GoalsEditor({
  goals,
  onChanged,
}: {
  goals: import("@/types/finance").GoalRow[];
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const save = async (row: import("@/types/finance").GoalRow) => {
    await getFinanceRepository().upsertGoal(row);
    await qc.invalidateQueries({ queryKey: QK.bootstrap });
    toast.success("Objetivo guardado");
    onChanged();
  };
  return (
    <div className="space-y-3">
      {goals.map((g) => (
        <Card key={g.id} className="border-border/80 bg-card/60">
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input defaultValue={g.name} onBlur={(e) => save({ ...g, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Importe objetivo (€)</Label>
              <Input
                defaultValue={String(g.targetAmountCents / 100)}
                onBlur={(e) => {
                  const c = parseEuroInputToCents(e.target.value);
                  if (c == null) return;
                  save({ ...g, targetAmountCents: c });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Año objetivo</Label>
              <Input
                defaultValue={String(g.targetYear)}
                onBlur={(e) => save({ ...g, targetYear: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Input defaultValue={g.type} disabled />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SimpleListEditor({
  title,
  rows,
  onChanged,
}: {
  title: string;
  rows: import("@/types/finance").IncomeTypeRow[];
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const save = async (row: import("@/types/finance").IncomeTypeRow) => {
    await getFinanceRepository().upsertIncomeType(row);
    await qc.invalidateQueries({ queryKey: QK.bootstrap });
    toast.success("Guardado");
    onChanged();
  };
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{title}</p>
      {rows.map((r) => (
        <Card key={r.id} className="border-border/80 bg-card/60">
          <CardContent className="p-4">
            <Input defaultValue={r.name} onBlur={(e) => save({ ...r, name: e.target.value })} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
