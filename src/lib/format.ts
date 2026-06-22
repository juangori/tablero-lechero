import type { Aggregation, BetterDirection } from '../types'

const nf = (decimals: number) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

export function fmtNumber(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return nf(decimals).format(value)
}

// Desvío absoluto (real - presupuesto) y porcentual
export function deviation(actual: number | null, budget: number | null) {
  if (actual === null || budget === null || actual === undefined || budget === undefined) {
    return { abs: null as number | null, pct: null as number | null }
  }
  const abs = actual - budget
  const pct = budget !== 0 ? abs / Math.abs(budget) : null
  return { abs, pct }
}

export type DevStatus = 'good' | 'bad' | 'neutral'

// ¿El real respecto del presupuesto es bueno o malo? Depende del sentido del indicador.
export function deviationStatus(
  actual: number | null,
  budget: number | null,
  dir: BetterDirection,
): DevStatus {
  if (actual === null || budget === null || dir === 'none') return 'neutral'
  const diff = actual - budget
  if (Math.abs(diff) < 1e-9) return 'neutral'
  if (dir === 'higher') return diff > 0 ? 'good' : 'bad'
  return diff < 0 ? 'good' : 'bad'
}

export const statusText: Record<DevStatus, string> = {
  good: 'text-emerald-700',
  bad: 'text-red-600',
  neutral: 'text-campo-700/60',
}
export const statusBg: Record<DevStatus, string> = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  bad: 'bg-red-50 text-red-700 ring-red-200',
  neutral: 'bg-campo-50 text-campo-700/70 ring-campo-200',
}

// Combina una serie de valores (en orden cronológico: semanas o meses) según el
// modo de agregación del indicador. Ignora los huecos (null).
//  - avg:  promedio de los valores cargados (tasas/intensidades)
//  - sum:  suma (eventos acumulables: muertes, etc.)
//  - last: último valor cargado (stocks puntuales: existencias de rodeo)
export function rollup(
  orderedValues: (number | null | undefined)[],
  agg: Aggregation = 'avg',
): number | null {
  const present = orderedValues.filter(
    (v): v is number => v !== null && v !== undefined && !Number.isNaN(v),
  )
  if (!present.length) return null
  switch (agg) {
    case 'sum':
      return present.reduce((a, b) => a + b, 0)
    case 'last':
      return present[present.length - 1]
    case 'avg':
    default:
      return present.reduce((a, b) => a + b, 0) / present.length
  }
}

// Parsea un número escrito a la es-AR (coma decimal, punto de miles).
// Devuelve null sólo si el texto está vacío o es realmente inválido.
export function parseNum(t: string): number | null {
  let s = t.trim()
  if (s === '') return null
  if (s.includes(',')) {
    // Hay coma => es el separador decimal; los puntos son de miles.
    s = s.replace(/\./g, '').replace(',', '.')
  } else if ((s.match(/\./g) || []).length > 1) {
    // Varios puntos y ninguna coma => son separadores de miles (1.234.567).
    s = s.replace(/\./g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
