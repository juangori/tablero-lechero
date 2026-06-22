import type { Aggregation, BetterDirection } from '../types'

export interface DefaultIndicator {
  name: string
  unit: string
  category: string
  decimals: number
  better_direction: BetterDirection
  aggregation: Aggregation
  sort_order: number
}

// Indicadores canónicos (del audio + Excel Campo Norte). El usuario puede
// agregar, quitar o modificar libremente desde la pantalla Indicadores.
// aggregation: avg = tasas/intensidades · sum = eventos acumulables · last = stock puntual
export const DEFAULT_INDICATORS: DefaultIndicator[] = [
  { name: 'Litros por vaca', unit: 'l/vaca/día', category: 'Producción', decimals: 1, better_direction: 'higher', aggregation: 'avg', sort_order: 10 },
  { name: 'Grasa', unit: '%', category: 'Producción', decimals: 2, better_direction: 'higher', aggregation: 'avg', sort_order: 20 },
  { name: 'Proteína', unit: '%', category: 'Producción', decimals: 2, better_direction: 'higher', aggregation: 'avg', sort_order: 30 },
  { name: 'Concentrado por vaca', unit: 'kg MS', category: 'Alimentación', decimals: 2, better_direction: 'none', aggregation: 'avg', sort_order: 40 },
  { name: 'Silo por vaca', unit: 'kg MF', category: 'Alimentación', decimals: 1, better_direction: 'none', aggregation: 'avg', sort_order: 50 },
  { name: 'Pasto por vaca', unit: 'kg MS', category: 'Alimentación', decimals: 1, better_direction: 'higher', aggregation: 'avg', sort_order: 60 },
  { name: 'Costo de alimentación', unit: 'US$/vaca', category: 'Alimentación', decimals: 2, better_direction: 'lower', aggregation: 'avg', sort_order: 70 },
  { name: 'RCS (células somáticas)', unit: 'miles/ml', category: 'Sanidad', decimals: 0, better_direction: 'lower', aggregation: 'avg', sort_order: 80 },
  { name: 'Incidencia de mastitis', unit: '%', category: 'Sanidad', decimals: 1, better_direction: 'lower', aggregation: 'avg', sort_order: 90 },
  { name: 'Bacterias', unit: 'ufc/ml', category: 'Sanidad', decimals: 0, better_direction: 'lower', aggregation: 'avg', sort_order: 100 },
  { name: 'Vacas en ordeñe', unit: 'cab', category: 'Rodeo', decimals: 0, better_direction: 'none', aggregation: 'last', sort_order: 110 },
  { name: 'Vacas masa', unit: 'cab', category: 'Rodeo', decimals: 0, better_direction: 'none', aggregation: 'last', sort_order: 120 },
  { name: 'Muertes en guachera', unit: 'cab', category: 'Sanidad', decimals: 0, better_direction: 'lower', aggregation: 'sum', sort_order: 130 },
  { name: 'Muertes al parto', unit: 'cab', category: 'Sanidad', decimals: 0, better_direction: 'lower', aggregation: 'sum', sort_order: 140 },
  { name: 'Gramos/día recría', unit: 'g/día', category: 'Rodeo', decimals: 0, better_direction: 'higher', aggregation: 'avg', sort_order: 150 },
]
