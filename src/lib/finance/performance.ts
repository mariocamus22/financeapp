/**
 * Rentabilidad sobre inversión: (valorMercado - capital) / capital.
 * Si capital <= 0, devuelve null para evitar divisiones raras.
 */
export function roiRatio(valueCents: number, capitalCents: number): number | null {
  if (capitalCents <= 0) return null;
  return (valueCents - capitalCents) / capitalCents;
}

export function roiAbsoluteCents(valueCents: number, capitalCents: number): number {
  return valueCents - capitalCents;
}
