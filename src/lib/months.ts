import type { Lang } from './i18n'

// Año agrícola: jul (month_index 1) .. jun (month_index 12)
// `key` es la clave canónica (no cambia con el idioma) y se usa para hacer
// match al importar planillas. Los nombres visibles se localizan.
export interface MonthDef {
  idx: number
  key: string
  es: { short: string; long: string }
  en: { short: string; long: string }
}

export const MONTHS: MonthDef[] = [
  { idx: 1, key: 'jul', es: { short: 'Jul', long: 'Julio' }, en: { short: 'Jul', long: 'July' } },
  { idx: 2, key: 'ago', es: { short: 'Ago', long: 'Agosto' }, en: { short: 'Aug', long: 'August' } },
  { idx: 3, key: 'set', es: { short: 'Set', long: 'Septiembre' }, en: { short: 'Sep', long: 'September' } },
  { idx: 4, key: 'oct', es: { short: 'Oct', long: 'Octubre' }, en: { short: 'Oct', long: 'October' } },
  { idx: 5, key: 'nov', es: { short: 'Nov', long: 'Noviembre' }, en: { short: 'Nov', long: 'November' } },
  { idx: 6, key: 'dic', es: { short: 'Dic', long: 'Diciembre' }, en: { short: 'Dec', long: 'December' } },
  { idx: 7, key: 'ene', es: { short: 'Ene', long: 'Enero' }, en: { short: 'Jan', long: 'January' } },
  { idx: 8, key: 'feb', es: { short: 'Feb', long: 'Febrero' }, en: { short: 'Feb', long: 'February' } },
  { idx: 9, key: 'mar', es: { short: 'Mar', long: 'Marzo' }, en: { short: 'Mar', long: 'March' } },
  { idx: 10, key: 'abr', es: { short: 'Abr', long: 'Abril' }, en: { short: 'Apr', long: 'April' } },
  { idx: 11, key: 'may', es: { short: 'May', long: 'Mayo' }, en: { short: 'May', long: 'May' } },
  { idx: 12, key: 'jun', es: { short: 'Jun', long: 'Junio' }, en: { short: 'Jun', long: 'June' } },
]

export function monthShort(idx: number, lang: Lang = 'en'): string {
  const m = MONTHS.find((x) => x.idx === idx)
  return m ? m[lang].short : String(idx)
}
export function monthLong(idx: number, lang: Lang = 'en'): string {
  const m = MONTHS.find((x) => x.idx === idx)
  return m ? m[lang].long : String(idx)
}

// Todos los encabezados posibles de columna para un mes (ambos idiomas + clave),
// usado al importar planillas para tolerar archivos en EN o ES.
export function monthHeaderKeys(m: MonthDef): string[] {
  return [m.en.short, m.en.long, m.es.short, m.es.long, m.key]
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
