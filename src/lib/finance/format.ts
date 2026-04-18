const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurCompact = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatEuroFromCents(cents: number): string {
  return eurFormatter.format(cents / 100);
}

export function formatEuroCompactFromCents(cents: number): string {
  return eurCompact.format(cents / 100);
}

/** Convierte texto de usuario (es-ES: miles con punto, decimal con coma) a céntimos. */
export function parseEuroInputToCents(input: string): number | null {
  const trimmed = input.trim().replace(/€/g, "").replace(/\s/g, "");
  if (!trimmed) return null;
  let normalized = trimmed;
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }
  if (normalized === "" || Number.isNaN(Number(normalized))) return null;
  const euros = Number(normalized);
  if (!Number.isFinite(euros)) return null;
  return Math.round(euros * 100);
}

export function formatDateEs(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
