import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { MONTHS } from '../lib/months'
import { deviation } from '../lib/format'
import { useSeason } from '../data/season'
import { useIndicators } from '../data/queries'
import { supabase } from '../lib/supabase'
import type { Budget, Indicator, MonthlyActual, Season, WeeklyEntry } from '../types'

export default function ImportExport() {
  const { seasons, selected, selectedId } = useSeason()
  const { data: indicators = [] } = useIndicators(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  /* ---------- EXPORT: backup completo ---------- */
  const exportBackup = async () => {
    setBusy('backup')
    setMsg(null)
    const [{ data: budgets }, { data: weekly }, { data: monthly }] = await Promise.all([
      supabase.from('budgets').select('*'),
      supabase.from('weekly_entries').select('*'),
      supabase.from('monthly_actuals').select('*'),
    ])
    const wb = XLSX.utils.book_new()

    // Indicadores
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        indicators.map((i) => ({
          Indicador: i.name,
          Unidad: i.unit,
          Categoría: i.category,
          Decimales: i.decimals,
          Sentido: i.better_direction,
          Activo: i.active ? 'sí' : 'no',
        })),
      ),
      'Indicadores',
    )

    // Una hoja resumen por ejercicio
    for (const s of seasons) {
      const aoa = sheetResumen(s, seasons, indicators, (budgets ?? []) as Budget[], (monthly ?? []) as MonthlyActual[])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), `Ejercicio ${s.name}`.slice(0, 31))
    }

    // Semanal crudo
    const indName = new Map(indicators.map((i) => [i.id, i.name]))
    const seaName = new Map(seasons.map((s) => [s.id, s.name]))
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        ((weekly ?? []) as WeeklyEntry[]).map((w) => ({
          Ejercicio: seaName.get(w.season_id),
          Indicador: indName.get(w.indicator_id),
          MesIdx: w.month_index,
          Mes: MONTHS.find((m) => m.idx === w.month_index)?.long,
          Semana: w.week_index,
          Valor: w.value,
        })),
      ),
      'Semanal',
    )

    XLSX.writeFile(wb, `tablero-lechero-backup.xlsx`)
    setBusy(null)
    setMsg('Backup descargado.')
  }

  /* ---------- EXPORT: resumen ejercicio actual ---------- */
  const exportSeason = async () => {
    if (!selected) return
    setBusy('season')
    setMsg(null)
    const [{ data: budgets }, { data: monthly }] = await Promise.all([
      supabase.from('budgets').select('*'),
      supabase.from('monthly_actuals').select('*'),
    ])
    const aoa = sheetResumen(selected, seasons, indicators, (budgets ?? []) as Budget[], (monthly ?? []) as MonthlyActual[])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), `Resumen ${selected.name}`.slice(0, 31))
    // Hoja presupuesto editable (Indicador × meses) para reimportar
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetPresupuesto(selected, indicators, (budgets ?? []) as Budget[])), 'Presupuesto')
    XLSX.writeFile(wb, `tablero-${selected.name}.xlsx`)
    setBusy(null)
    setMsg('Resumen descargado.')
  }

  /* ---------- IMPORT: presupuesto desde planilla ---------- */
  const importBudget = async (file: File) => {
    if (!selectedId) return
    setBusy('import')
    setMsg(null)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const sheetName = wb.SheetNames.find((n) => /presupuesto/i.test(n)) ?? wb.SheetNames[0]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName])
      const byName = new Map(indicators.map((i) => [norm(i.name), i]))
      const upserts: { season_id: string; indicator_id: string; month_index: number; value: number | null }[] = []
      let matched = 0
      for (const row of rows) {
        const indName = String(row['Indicador'] ?? row['indicador'] ?? '').trim()
        const ind = byName.get(norm(indName))
        if (!ind) continue
        matched++
        for (const mo of MONTHS) {
          const raw = row[mo.short] ?? row[mo.long] ?? row[mo.key]
          if (raw === undefined || raw === '' || raw === null) continue
          const value = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'))
          if (Number.isFinite(value))
            upserts.push({ season_id: selectedId, indicator_id: ind.id, month_index: mo.idx, value })
        }
      }
      if (upserts.length) {
        const { error } = await supabase
          .from('budgets')
          .upsert(upserts, { onConflict: 'season_id,indicator_id,month_index' })
        if (error) throw error
      }
      setMsg(`Importado: ${matched} indicadores, ${upserts.length} valores de presupuesto en ${selected?.name}.`)
    } catch (e) {
      setMsg('Error al importar: ' + (e as Error).message)
    }
    setBusy(null)
  }

  return (
    <div>
      <PageHeader title="Importar / Exportar" subtitle="Backups en Excel y carga masiva de presupuesto" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-campo-800 font-bold mb-1">
            <Download size={18} /> Exportar
          </div>
          <p className="text-sm text-campo-700/60 mb-4">
            Descargá tus datos en Excel. Sirve de respaldo y para compartir.
          </p>
          <div className="space-y-2">
            <button className="btn-primary w-full" onClick={exportSeason} disabled={!!busy || !selected}>
              {busy === 'season' ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
              Resumen del ejercicio {selected?.name ?? ''}
            </button>
            <button className="btn-ghost w-full" onClick={exportBackup} disabled={!!busy}>
              {busy === 'backup' ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              Backup completo (todos los años)
            </button>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-campo-800 font-bold mb-1">
            <Upload size={18} /> Importar presupuesto
          </div>
          <p className="text-sm text-campo-700/60 mb-4">
            Subí un Excel con una hoja <b>Presupuesto</b> (columna <i>Indicador</i> y columnas Jul…Jun) para
            cargar el presupuesto del ejercicio <b>{selected?.name ?? '—'}</b>. Tip: exportá el resumen primero
            para tener la plantilla.
          </p>
          <label className="btn-ghost w-full cursor-pointer">
            {busy === 'import' ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            Elegir archivo .xlsx
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={!!busy || !selectedId}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importBudget(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      {msg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm ring-1 ring-emerald-200">
          <CheckCircle2 size={18} /> {msg}
        </div>
      )}
    </div>
  )
}

/* ---------- helpers de hojas ---------- */
function sheetResumen(
  season: Season,
  seasons: Season[],
  indicators: Indicator[],
  budgets: Budget[],
  monthly: MonthlyActual[],
): (string | number | null)[][] {
  const prev = seasons.find((s) => s.start_year === season.start_year - 1)
  const bMap = new Map(budgets.filter((b) => b.season_id === season.id).map((b) => [`${b.indicator_id}|${b.month_index}`, b.value]))
  const rMap = new Map(monthly.map((m) => [`${m.season_id}|${m.indicator_id}|${m.month_index}`, m.value]))
  const header = ['Indicador', 'Mes', 'Presupuesto', 'Real', 'Desvío', '%', prev ? `Real ${prev.name}` : 'Año ant.']
  const aoa: (string | number | null)[][] = [header]
  for (const ind of indicators) {
    for (const mo of MONTHS) {
      const bud = bMap.get(`${ind.id}|${mo.idx}`) ?? null
      const real = rMap.get(`${season.id}|${ind.id}|${mo.idx}`) ?? null
      const prevV = prev ? rMap.get(`${prev.id}|${ind.id}|${mo.idx}`) ?? null : null
      const dev = deviation(real, bud)
      aoa.push([ind.name, mo.short, bud, real, dev.abs, dev.pct, prevV])
    }
  }
  return aoa
}

function sheetPresupuesto(season: Season, indicators: Indicator[], budgets: Budget[]): (string | number | null)[][] {
  const bMap = new Map(budgets.filter((b) => b.season_id === season.id).map((b) => [`${b.indicator_id}|${b.month_index}`, b.value]))
  const header = ['Indicador', ...MONTHS.map((m) => m.short)]
  const aoa: (string | number | null)[][] = [header]
  for (const ind of indicators) {
    aoa.push([ind.name, ...MONTHS.map((mo) => bMap.get(`${ind.id}|${mo.idx}`) ?? null)])
  }
  return aoa
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
