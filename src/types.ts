export type BetterDirection = 'higher' | 'lower' | 'none'

// Cómo se combinan las semanas en el mes y los meses en el año:
//  avg = promedio (tasas), sum = suma (eventos acumulables), last = último valor (stocks)
export type Aggregation = 'avg' | 'sum' | 'last'

export interface Indicator {
  id: string
  name: string
  unit: string | null
  category: string
  decimals: number
  better_direction: BetterDirection
  aggregation: Aggregation
  active: boolean
  sort_order: number
  created_at?: string
}

export interface Season {
  id: string
  name: string
  start_year: number
  active: boolean
  created_at?: string
}

export interface Budget {
  id: string
  season_id: string
  indicator_id: string
  month_index: number
  value: number | null
}

export interface WeeklyEntry {
  id: string
  season_id: string
  indicator_id: string
  month_index: number
  week_index: number
  value: number | null
  entry_date: string | null
  note: string | null
  updated_at?: string
}

export interface MonthlyActual {
  season_id: string
  indicator_id: string
  month_index: number
  value: number | null
  weeks_loaded: number
}

export const CATEGORIES = [
  'Producción',
  'Alimentación',
  'Sanidad',
  'Rodeo',
  'Reproducción',
  'Otros',
] as const
export type Category = (typeof CATEGORIES)[number]
