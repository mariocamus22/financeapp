"use client";

import * as LucideIcons from "lucide-react";
import type { ComponentType } from "react";

function toPascalCase(name: string) {
  return name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

export function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const key = toPascalCase(name);
  const Cmp = (
    LucideIcons as unknown as Record<string, ComponentType<{ className?: string }>>
  )[key];
  if (!Cmp) {
    const Fallback = LucideIcons.Circle;
    return <Fallback className={className} />;
  }
  return <Cmp className={className} />;
}
