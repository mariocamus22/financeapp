"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatYearMonthLongEs } from "@/lib/finance/month-names";
import { useMemo } from "react";

export function MorePage() {
  const links = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return [
      { href: "/transacciones", title: "Transacciones", desc: "Lista, filtros y edición" },
      { href: "/inversiones", title: "Inversiones", desc: "Portfolio y objetivos" },
      {
        href: `/resumen/mensual/${y}/${m}`,
        title: "Resumen mensual",
        desc: `Extracto de ${formatYearMonthLongEs(y, m)}`,
      },
      { href: `/resumen/anual/${y}`, title: "Resumen anual", desc: "Vista macro del año" },
      { href: "/configuracion", title: "Configuración", desc: "Plataformas, categorías, JSON" },
    ] as const;
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Más</h1>
        <p className="text-sm text-muted-foreground">
          Accesos rápidos al resto de la app.
        </p>
      </header>
      <div className="space-y-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="border-border/80 bg-card/60 transition hover:bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="font-medium">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
