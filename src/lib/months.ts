// Año agrícola: jul (month_index 1) .. jun (month_index 12)
export interface MonthDef {
  idx: number
  key: string
  short: string
  long: string
}

export const MONTHS: MonthDef[] = [
  { idx: 1, key: 'jul', short: 'Jul', long: 'Julio' },
  { idx: 2, key: 'ago', short: 'Ago', long: 'Agosto' },
  { idx: 3, key: 'set', short: 'Set', long: 'Septiembre' },
  { idx: 4, key: 'oct', short: 'Oct', long: 'Octubre' },
  { idx: 5, key: 'nov', short: 'Nov', long: 'Noviembre' },
  { idx: 6, key: 'dic', short: 'Dic', long: 'Diciembre' },
  { idx: 7, key: 'ene', short: 'Ene', long: 'Enero' },
  { idx: 8, key: 'feb', short: 'Feb', long: 'Febrero' },
  { idx: 9, key: 'mar', short: 'Mar', long: 'Marzo' },
  { idx: 10, key: 'abr', short: 'Abr', long: 'Abril' },
  { idx: 11, key: 'may', short: 'May', long: 'Mayo' },
  { idx: 12, key: 'jun', short: 'Jun', long: 'Junio' },
]

export function monthShort(idx: number): string {
  return MONTHS.find((m) => m.idx === idx)?.short ?? String(idx)
}
export function monthLong(idx: number): string {
  return MONTHS.find((m) => m.idx === idx)?.long ?? String(idx)
}

// Año calendario de un month_index dentro de un ejercicio que arranca en startYear (julio)
export function calendarYear(monthIndex: number, startYear: number): number {
  return monthIndex <= 6 ? startYear : startYear + 1
}

// Nombre de ejercicio a partir del año de inicio: 2024 -> "24-25"
export function seasonNameFromStart(startYear: number): string {
  const a = String(startYear).slice(-2)
  const b = String(startYear + 1).slice(-2)
  return `${a}-${b}`
}

export const WEEKS = [1, 2, 3, 4, 5]
