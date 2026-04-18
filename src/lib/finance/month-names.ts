/** Mes civil 1–12 en minúsculas (UI en español). */
const NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export function monthNameEs(month: number): string {
  if (month < 1 || month > 12) return "";
  return NAMES[month - 1];
}

/** Ej. "enero 2026" */
export function formatYearMonthLongEs(year: number, month: number): string {
  return `${monthNameEs(month)} ${year}`;
}

/** Etiqueta corta para tablas / ejes (tres letras del nombre). */
export function monthShortLabelEs(month: number): string {
  const n = monthNameEs(month);
  if (!n) return "";
  if (n.length <= 3) return n;
  return n.slice(0, 3);
}

/** Primer día del mes en ISO (YYYY-MM-DD). */
export function firstDayOfMonthIso(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}
