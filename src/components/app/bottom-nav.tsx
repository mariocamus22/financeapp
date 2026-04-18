"use client";

import { cn } from "@/lib/utils";
import { Home, Layers, Menu, PiggyBank } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/patrimonio", label: "Patrimonio", icon: Layers },
  { href: "/presupuesto", label: "Presupuesto", icon: PiggyBank },
  { href: "/mas", label: "Más", icon: Menu },
] as const;

const secondaryPrefixes = [
  "/mas",
  "/configuracion",
  "/transacciones",
  "/inversiones",
  "/resumen",
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const moreActive = secondaryPrefixes.some((p) => pathname.startsWith(p));

  return (
    <nav className="border-border/80 bg-card/95 supports-[backdrop-filter]:bg-card/80 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/mas"
              ? moreActive
              : href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition active:scale-[0.98]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </Link>
          );
        })}
        <div className="w-14 shrink-0" aria-hidden />
      </div>
    </nav>
  );
}
