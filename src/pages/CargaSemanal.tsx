import { useMemo, useState } from 'react'
import { ClipboardPen } from 'lucide-react'
import { PageHeader, Spinner, EmptyState, Badge } from '../components/ui'
import EditableCell from '../components/EditableCell'
import { MONTHS, WEEKS, monthLong, monthShort } from '../lib/months'
import { fmtNumber, deviation, deviationStatus, statusBg, rollup } from '../lib/format'
import { useSeason } from '../data/season'
import { useBudgets, useIndicators, useUpsertWeekly, useWeeklyEntries } from '../data/queries'
import { useI18n, rich } from '../lib/i18n'
import type { Aggregation } from '../types'

export default function CargaSemanal() {
  const { t, lang, tInd, tUnit } = useI18n()
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

  // Valor del mes a partir de las semanas, según la agregación del indicador
  // (suma para eventos, último para stock, promedio para tasas). Igual que la vista.
  const monthValue = (ind: { id: string; aggregation: Aggregation }) => {
    const vals = WEEKS.map((w) => weekMap.get(`${ind.id}|${month}|${w}`))
    return rollup(vals, ind.aggregation)
  }

  if (!seasons.length) {
    return (
      <div>
        <PageHeader title={t('weekly.title')} />
        <EmptyState icon={<ClipboardPen size={40} />} title={t('weekly.empty.title')}>
          {rich(t('weekly.empty.body', { budget: t('nav.budget') }))}
        </EmptyState>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('weekly.title')}
        subtitle={t('weekly.subtitle', { name: selected?.name ?? '', month: monthLong(month, lang) })}
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
            {monthShort(mo.idx, lang)}
          </button>
        ))}
      </div>

      {li || lw ? (
        <Spinner label={t('weekly.loading')} />
      ) : !indicators.length ? (
        <EmptyState icon={<ClipboardPen size={40} />} title={t('weekly.noind.title')}>
          {rich(t('weekly.noind.body', { indicators: t('nav.indicators') }))}
        </EmptyState>
      ) : (
        <div className="card overflow-x-auto scroll-x">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-campo-50 text-left font-semibold text-campo-800 px-4 py-3 border-b border-black/5 min-w-[180px]">
                  {t('weekly.col.indicator')}
                </th>
                {WEEKS.map((w) => (
                  <th key={w} className="bg-campo-50 text-campo-700/70 font-semibold px-2 py-3 border-b border-black/5 text-center min-w-[64px]">
                    {t('weekly.col.week', { n: w })}
                  </th>
                ))}
                <th className="bg-campo-100 text-campo-800 font-bold px-3 py-3 border-b border-black/5 text-center min-w-[78px]">
                  {t('weekly.col.month')}
                </th>
                <th className="bg-campo-50 text-campo-700/70 font-semibold px-3 py-3 border-b border-black/5 text-center min-w-[72px]">
                  {t('weekly.col.budget')}
                </th>
                <th className="bg-campo-50 text-campo-700/70 font-semibold px-3 py-3 border-b border-black/5 text-center min-w-[88px]">
                  {t('weekly.col.deviation')}
                </th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((ind, ri) => {
                const avg = monthValue(ind)
                const bud = budgetMap.get(`${ind.id}|${month}`) ?? null
                const dev = deviation(avg, bud)
                const status = deviationStatus(avg, bud, ind.better_direction)
                return (
                  <tr key={ind.id} className={ri % 2 ? 'bg-campo-50/30' : 'bg-white'}>
                    <td className={`sticky left-0 z-10 ${ri % 2 ? 'bg-[#f4f7f1]' : 'bg-white'} px-4 py-2 border-b border-black/5`}>
                      <div className="font-semibold text-campo-800 leading-tight">{tInd(ind.name)}</div>
                      {ind.unit && <div className="text-[11px] text-campo-700/50">{tUnit(ind.unit)}</div>}
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
                          {fmtNumber(dev.pct * 100, 1)}%
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
        {rich(t('weekly.footer'))}
      </p>
    </div>
  )
}
