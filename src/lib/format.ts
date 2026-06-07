import type { BetterDirection, Indicator } from '../types'

const nf = (decimals: number) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

export function fmtValue(value: number | null | undefined, ind: Pick<Indicator, 'decimals' | 'is_percent'>): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  if (ind.is_percent) return nf(ind.decimals).format(value * 100) + '%'
  return nf(ind.decimals).format(value)
}

export function fmtNumber(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return nf(decimals).format(value)
}

export function fmtPct(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return sign + nf(decimals).format(value * 100) + '%'
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
