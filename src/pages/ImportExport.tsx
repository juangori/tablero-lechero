import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { MONTHS, monthShort, monthLong, monthHeaderKeys } from '../lib/months'
import { deviation, parseNum } from '../lib/format'
import { useSeason } from '../data/season'
import { useIndicators } from '../data/queries'
import { supabase } from '../lib/supabase'
import { useI18n, rich, type Lang, type TFn } from '../lib/i18n'
import type { Budget, Indicator, MonthlyActual, Season, WeeklyEntry } from '../types'

export default function ImportExport() {
  const { t, lang } = useI18n()
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
          [t('xls.h.indicator')]: i.name,
          [t('xls.h.unit')]: i.unit,
          [t('xls.h.category')]: i.category,
          [t('xls.h.decimals')]: i.decimals,
          [t('xls.h.direction')]: t('dir.' + i.better_direction),
          [t('xls.h.active')]: i.active ? t('xls.yes') : t('xls.no'),
        })),
      ),
      t('xls.tab.indicators'),
    )

    // Una hoja resumen por ejercicio
    for (const s of seasons) {
      const aoa = sheetResumen(s, seasons, indicators, (budgets ?? []) as Budget[], (monthly ?? []) as MonthlyActual[], t, lang)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), t('xls.tab.season', { name: s.name }).slice(0, 31))
    }

    // Semanal crudo
    const indName = new Map(indicators.map((i) => [i.id, i.name]))
    const seaName = new Map(seasons.map((s) => [s.id, s.name]))
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        ((weekly ?? []) as WeeklyEntry[]).map((w) => ({
          [t('xls.h.season')]: seaName.get(w.season_id),
          [t('xls.h.indicator')]: indName.get(w.indicator_id),
          [t('xls.h.monthIdx')]: w.month_index,
          [t('xls.h.month')]: monthLong(w.month_index, lang),
          [t('xls.h.week')]: w.week_index,
          [t('xls.h.value')]: w.value,
        })),
      ),
      t('xls.tab.weekly'),
    )

    XLSX.writeFile(wb, `tablero-lechero-backup.xlsx`)
    setBusy(null)
    setMsg(t('data.msg.backup'))
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
    const aoa = sheetResumen(selected, seasons, indicators, (budgets ?? []) as Budget[], (monthly ?? []) as MonthlyActual[], t, lang)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), t('xls.tab.summary', { name: selected.name }).slice(0, 31))
    // Hoja presupuesto editable (Indicador × meses) para reimportar
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetPresupuesto(selected, indicators, (budgets ?? []) as Budget[], t, lang)), t('xls.tab.budget'))
    XLSX.writeFile(wb, `tablero-${selected.name}.xlsx`)
    setBusy(null)
    setMsg(t('data.msg.season'))
  }

  /* ---------- IMPORT: presupuesto desde planilla ---------- */
  const importBudget = async (file: File) => {
    if (!selectedId) return
    setBusy('import')
    setMsg(null)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const sheetName =
        wb.SheetNames.find((n) => /presupuesto|budget/i.test(n)) ?? wb.SheetNames[0]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName])
      const byName = new Map(indicators.map((i) => [norm(i.name), i]))
      const upserts: { season_id: string; indicator_id: string; month_index: number; value: number | null }[] = []
      let matched = 0
      for (const row of rows) {
        const indName = String(
          row['Indicator'] ?? row['Indicador'] ?? row['indicator'] ?? row['indicador'] ?? '',
        ).trim()
        const ind = byName.get(norm(indName))
        if (!ind) continue
        matched++
        for (const mo of MONTHS) {
          // Tolera encabezados de mes en EN o ES (más la clave canónica).
          let raw: unknown = undefined
          for (const key of monthHeaderKeys(mo)) {
            if (row[key] !== undefined) {
              raw = row[key]
              break
            }
          }
          if (raw === undefined || raw === '' || raw === null) continue
          const value = typeof raw === 'number' ? raw : parseNum(String(raw))
          if (value !== null && Number.isFinite(value))
            upserts.push({ season_id: selectedId, indicator_id: ind.id, month_index: mo.idx, value })
        }
      }
      if (upserts.length) {
        const { error } = await supabase
          .from('budgets')
          .upsert(upserts, { onConflict: 'season_id,indicator_id,month_index' })
        if (error) throw error
      }
      setMsg(t('data.msg.import', { ind: matched, vals: upserts.length, name: selected?.name ?? '' }))
    } catch (e) {
      setMsg(t('data.msg.error', { msg: (e as Error).message }))
    }
    setBusy(null)
  }

  return (
    <div>
      <PageHeader title={t('data.title')} subtitle={t('data.subtitle')} />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-campo-800 font-bold mb-1">
            <Download size={18} /> {t('data.export')}
          </div>
          <p className="text-sm text-campo-700/60 mb-4">{t('data.export.desc')}</p>
          <div className="space-y-2">
            <button className="btn-primary w-full" onClick={exportSeason} disabled={!!busy || !selected}>
              {busy === 'season' ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
              {t('data.export.season', { name: selected?.name ?? '' })}
            </button>
            <button className="btn-ghost w-full" onClick={exportBackup} disabled={!!busy}>
              {busy === 'backup' ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              {t('data.export.backup')}
            </button>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-campo-800 font-bold mb-1">
            <Upload size={18} /> {t('data.import')}
          </div>
          <p className="text-sm text-campo-700/60 mb-4">
            {rich(
              t('data.import.desc', {
                budget: t('xls.tab.budget'),
                indicator: t('xls.h.indicator'),
                name: selected?.name ?? '—',
              }),
            )}
          </p>
          <label className="btn-ghost w-full cursor-pointer">
            {busy === 'import' ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {t('data.import.choose')}
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
  t: TFn,
  lang: Lang,
): (string | number | null)[][] {
  const prev = seasons.find((s) => s.start_year === season.start_year - 1)
  const bMap = new Map(budgets.filter((b) => b.season_id === season.id).map((b) => [`${b.indicator_id}|${b.month_index}`, b.value]))
  const rMap = new Map(monthly.map((m) => [`${m.season_id}|${m.indicator_id}|${m.month_index}`, m.value]))
  const header = [
    t('xls.h.indicator'),
    t('xls.h.month'),
    t('xls.h.budget'),
    t('xls.h.actual'),
    t('xls.h.deviation'),
    t('xls.h.pct'),
    prev ? t('chart.actualPrev', { name: prev.name }) : t('xls.h.prevYear'),
  ]
  const aoa: (string | number | null)[][] = [header]
  for (const ind of indicators) {
    for (const mo of MONTHS) {
      const bud = bMap.get(`${ind.id}|${mo.idx}`) ?? null
      const real = rMap.get(`${season.id}|${ind.id}|${mo.idx}`) ?? null
      const prevV = prev ? rMap.get(`${prev.id}|${ind.id}|${mo.idx}`) ?? null : null
      const dev = deviation(real, bud)
      aoa.push([ind.name, monthShort(mo.idx, lang), bud, real, dev.abs, dev.pct, prevV])
    }
  }
  return aoa
}

function sheetPresupuesto(
  season: Season,
  indicators: Indicator[],
  budgets: Budget[],
  t: TFn,
  lang: Lang,
): (string | number | null)[][] {
  const bMap = new Map(budgets.filter((b) => b.season_id === season.id).map((b) => [`${b.indicator_id}|${b.month_index}`, b.value]))
  const header = [t('xls.h.indicator'), ...MONTHS.map((m) => monthShort(m.idx, lang))]
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
