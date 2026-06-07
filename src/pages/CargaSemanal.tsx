import { useMemo, useState } from 'react'
import { ClipboardPen } from 'lucide-react'
import { PageHeader, Spinner, EmptyState, Badge } from '../components/ui'
import EditableCell from '../components/EditableCell'
import { MONTHS, WEEKS, monthLong } from '../lib/months'
import { fmtNumber, deviation, deviationStatus, statusBg } from '../lib/format'
import { useSeason } from '../data/season'
import { useBudgets, useIndicators, useUpsertWeekly, useWeeklyEntries } from '../data/queries'

export default function CargaSemanal() {
  const { seasons, selected, selectedId } = useSeason()
  const { data: indicators = [], isLoading: li } = useIndicators()
  const { data: weekly = [], isLoading: lw } = useWeeklyEntries(selectedId)
  const { data: budgets = [] } = useBudgets(selectedId)
  const upsert = useUpsertWeekly()
  const [month, setMonth] = useState(1)

  const weekMap = useMemo(() => {
    const m = new Map<string, number | null>()
    for (const w of weekly) m.set(`${w.indicator_id}|${w.month_index}|${w.week_index}`, w.value)
    return m
  }, [weekly])

  const budgetMap = useMemo(() => {
    const m = new Map<string, number | null>()
    for (const b of budgets) m.set(`${b.indicator_id}|${b.month_index}`, b.value)
    return m
  }, [budgets])

  const monthAvg = (indId: string) => {
    const vals = WEEKS.map((w) => weekMap.get(`${indId}|${month}|${w}`)).filter(
      (v): v is number => v !== null && v !== undefined,
    )
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  if (!seasons.length) {
    return (
      <div>
        <PageHeader title="Carga semanal" />
        <EmptyState icon={<ClipboardPen size={40} />} title="Primero creá un ejercicio">
          Andá a <b>Presupuesto</b> para crear el ejercicio del año. Después cargás acá los datos semana a semana.
        </EmptyState>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Carga semanal"
        subtitle={`Ejercicio ${selected?.name ?? ''} · ${monthLong(month)}`}
      />

      {/* Selector de mes */}
      <div className="flex gap-1.5 overflow-x-auto scroll-x pb-2 mb-4">
        {MONTHS.map((mo) => (
          <button
            key={mo.idx}
            onClick={() => setMonth(mo.idx)}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              month === mo.idx
                ? 'bg-campo-600 text-white shadow-sm'
                : 'bg-white text-campo-700/70 ring-1 ring-campo-200 hover:bg-campo-50'
            }`}
          >
            {mo.short}
          </button>
        ))}
      </div>

      {li || lw ? (
        <Spinner label="Cargando datos…" />
      ) : !indicators.length ? (
        <EmptyState icon={<ClipboardPen size={40} />} title="No hay indicadores activos">
          Creá indicadores en la sección <b>Indicadores</b>.
        </EmptyState>
      ) : (
        <div className="card overflow-x-auto scroll-x">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-campo-50 text-left font-semibold text-campo-800 px-4 py-3 border-b border-black/5 min-w-[180px]">
                  Indicador
                </th>
                {WEEKS.map((w) => (
                  <th key={w} className="bg-campo-50 text-campo-700/70 font-semibold px-2 py-3 border-b border-black/5 text-center min-w-[64px]">
                    S{w}
                  </th>
                ))}
                <th className="bg-campo-100 text-campo-800 font-bold px-3 py-3 border-b border-black/5 text-center min-w-[78px]">
                  Mes
                </th>
                <th className="bg-campo-50 text-campo-700/70 font-semibold px-3 py-3 border-b border-black/5 text-center min-w-[72px]">
                  Presup
                </th>
                <th className="bg-campo-50 text-campo-700/70 font-semibold px-3 py-3 border-b border-black/5 text-center min-w-[88px]">
                  Desvío
                </th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((ind, ri) => {
                const avg = monthAvg(ind.id)
                const bud = budgetMap.get(`${ind.id}|${month}`) ?? null
                const dev = deviation(avg, bud)
                const status = deviationStatus(avg, bud, ind.better_direction)
                return (
                  <tr key={ind.id} className={ri % 2 ? 'bg-campo-50/30' : 'bg-white'}>
                    <td className={`sticky left-0 z-10 ${ri % 2 ? 'bg-[#f4f7f1]' : 'bg-white'} px-4 py-2 border-b border-black/5`}>
                      <div className="font-semibold text-campo-800 leading-tight">{ind.name}</div>
                      {ind.unit && <div className="text-[11px] text-campo-700/50">{ind.unit}</div>}
                    </td>
                    {WEEKS.map((w) => (
                      <td key={w} className="border-b border-black/5 px-1">
                        <EditableCell
                          value={weekMap.get(`${ind.id}|${month}|${w}`)}
                          onCommit={(v) =>
                            upsert.mutate({
                              season_id: selectedId!,
                              indicator_id: ind.id,
                              month_index: month,
                              week_index: w,
                              value: v,
                            })
                          }
                        />
                      </td>
                    ))}
                    <td className="border-b border-black/5 px-3 text-right font-bold tabular-nums text-campo-800 bg-campo-50/40">
                      {fmtNumber(avg, ind.decimals)}
                    </td>
                    <td className="border-b border-black/5 px-3 text-right tabular-nums text-campo-700/60">
                      {fmtNumber(bud, ind.decimals)}
                    </td>
                    <td className="border-b border-black/5 px-2 text-center">
                      {dev.pct !== null ? (
                        <Badge className={statusBg[status]}>
                          {dev.pct > 0 ? '+' : ''}
                          {fmtNumber(dev.pct * 100, 0)}%
                        </Badge>
                      ) : (
                        <span className="text-campo-700/30">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-campo-700/50 mt-3 px-1">
        Cargá cada semana (S1–S5). El <b>promedio mensual</b> se calcula solo con las semanas que cargues.
        Se guarda al salir de la celda.
      </p>
    </div>
  )
}
