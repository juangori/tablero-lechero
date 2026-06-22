import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { LayoutDashboard, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PageHeader, Spinner, EmptyState } from '../components/ui'
import { MONTHS, monthShort, monthLong } from '../lib/months'
import { fmtNumber, deviation, deviationStatus, statusText, rollup } from '../lib/format'
import { useSeason } from '../data/season'
import { useBudgets, useIndicators, useMonthlyActuals } from '../data/queries'
import { useI18n, rich } from '../lib/i18n'
import type { Indicator } from '../types'

export default function Dashboard() {
  const { t, lang } = useI18n()
  const { seasons, selected, selectedId } = useSeason()
  const { data: indicators = [], isLoading: li } = useIndicators()
  const { data: budgets = [], isLoading: lb } = useBudgets(selectedId)
  const { data: monthly = [], isLoading: lm } = useMonthlyActuals()
  const [focusId, setFocusId] = useState<string | null>(null)

  // Ejercicio anterior: el contiguo (start_year-1) o, si falta, el más cercano por debajo.
  const prevSeason = useMemo(() => {
    if (!selected) return undefined
    const exact = seasons.find((s) => s.start_year === selected.start_year - 1)
    if (exact) return exact
    return seasons
      .filter((s) => s.start_year < selected.start_year)
      .sort((a, b) => b.start_year - a.start_year)[0]
  }, [seasons, selected])

  // real[seasonId|indId|month] -> value
  const realMap = useMemo(() => {
    const m = new Map<string, number | null>()
    for (const r of monthly) m.set(`${r.season_id}|${r.indicator_id}|${r.month_index}`, r.value)
    return m
  }, [monthly])

  const budgetMap = useMemo(() => {
    const m = new Map<string, number | null>()
    for (const b of budgets) m.set(`${b.indicator_id}|${b.month_index}`, b.value)
    return m
  }, [budgets])

  // KPI anual del real, según la agregación del indicador (avg/sum/last).
  const annualReal = (ind: Indicator) => {
    const vals = MONTHS.map((mo) => realMap.get(`${selectedId}|${ind.id}|${mo.idx}`))
    return rollup(vals, ind.aggregation)
  }

  // KPI anual del presupuesto, alineado a los meses que ya tienen real cargado (YTD)
  // para que la comparación sea peras con peras. Si no hay real, usa el año completo.
  const annualBudget = (ind: Indicator) => {
    const realMonths = MONTHS.filter(
      (mo) => realMap.get(`${selectedId}|${ind.id}|${mo.idx}`) != null,
    )
    const months = realMonths.length ? realMonths : MONTHS
    const vals = months.map((mo) => budgetMap.get(`${ind.id}|${mo.idx}`))
    return rollup(vals, ind.aggregation)
  }

  const focus: Indicator | undefined = useMemo(
    () => indicators.find((i) => i.id === focusId) ?? indicators[0],
    [indicators, focusId],
  )

  if (!seasons.length) {
    return (
      <div>
        <PageHeader title={t('dash.title')} />
        <EmptyState icon={<LayoutDashboard size={40} />} title={t('dash.welcome.title')}>
          {rich(t('dash.welcome.body', { budget: t('nav.budget') }))}
        </EmptyState>
      </div>
    )
  }

  if (li || lb || lm) return <Spinner label={t('dash.loading')} />

  const L_BUDGET = t('chart.budget')
  const L_ACTUAL = t('chart.actual')
  const prevKey = prevSeason ? t('chart.actualPrev', { name: prevSeason.name }) : t('chart.prevYear')

  const chartData = MONTHS.map((mo) => ({
    mes: monthShort(mo.idx, lang),
    [L_BUDGET]: budgetMap.get(`${focus?.id}|${mo.idx}`) ?? null,
    [L_ACTUAL]: focus ? realMap.get(`${selectedId}|${focus.id}|${mo.idx}`) ?? null : null,
    [prevKey]: focus && prevSeason
      ? realMap.get(`${prevSeason.id}|${focus.id}|${mo.idx}`) ?? null
      : null,
  }))

  return (
    <div>
      <PageHeader
        title={t('dash.title')}
        subtitle={
          t('dash.subtitle', { name: selected?.name ?? '' }) +
          (prevSeason ? t('dash.comparedWith', { prev: prevSeason.name }) : '')
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {indicators.map((ind) => {
          const real = annualReal(ind)
          const bud = annualBudget(ind)
          const dev = deviation(real, bud)
          const status = deviationStatus(real, bud, ind.better_direction)
          return (
            <button
              key={ind.id}
              onClick={() => setFocusId(ind.id)}
              className={`card p-4 text-left transition hover:ring-campo-300 ${
                focus?.id === ind.id ? 'ring-2 ring-campo-500' : ''
              }`}
            >
              <div className="text-xs font-semibold text-campo-700/60 truncate">{ind.name}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-campo-800 tabular-nums">
                  {fmtNumber(real, ind.decimals)}
                </span>
                {ind.unit && <span className="text-[11px] text-campo-700/40">{ind.unit}</span>}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                <span className="text-campo-700/50">{t('dash.kpi.bud', { value: fmtNumber(bud, ind.decimals) })}</span>
                {dev.pct !== null && (
                  <span className={`ml-auto inline-flex items-center gap-0.5 font-bold ${statusText[status]}`}>
                    {status === 'good' ? <TrendingUp size={13} /> : status === 'bad' ? <TrendingDown size={13} /> : <Minus size={13} />}
                    {dev.pct > 0 ? '+' : ''}
                    {fmtNumber(dev.pct * 100, 1)}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Gráfico + tabla del indicador en foco */}
      {focus && (
        <div className="space-y-4">
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <h2 className="font-bold text-campo-800">
                {focus.name} {focus.unit && <span className="text-sm font-normal text-campo-700/50">({focus.unit})</span>}
              </h2>
              <select
                className="input max-w-[220px]"
                value={focus.id}
                onChange={(e) => setFocusId(e.target.value)}
              >
                {indicators.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    formatter={(v: number) => fmtNumber(v, focus.decimals)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey={L_BUDGET} stroke="#a0c78f" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
                  {prevSeason && (
                    <Line type="monotone" dataKey={prevKey} stroke="#9ca3af" strokeWidth={2} dot={false} connectNulls />
                  )}
                  <Line type="monotone" dataKey={L_ACTUAL} stroke="#3e6f2e" strokeWidth={3} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla detalle */}
          <div className="card overflow-x-auto scroll-x">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-campo-50 text-campo-700/70">
                  <th className="text-left font-semibold px-4 py-2.5 border-b border-black/5">{t('dash.table.month')}</th>
                  <th className="text-right font-semibold px-3 py-2.5 border-b border-black/5">{t('dash.table.budget')}</th>
                  <th className="text-right font-semibold px-3 py-2.5 border-b border-black/5">{t('dash.table.actual')}</th>
                  <th className="text-right font-semibold px-3 py-2.5 border-b border-black/5">{t('dash.table.deviation')}</th>
                  <th className="text-right font-semibold px-3 py-2.5 border-b border-black/5">{t('dash.table.pct')}</th>
                  {prevSeason && (
                    <th className="text-right font-semibold px-3 py-2.5 border-b border-black/5">{prevSeason.name}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((mo, ri) => {
                  const bud = budgetMap.get(`${focus.id}|${mo.idx}`) ?? null
                  const real = realMap.get(`${selectedId}|${focus.id}|${mo.idx}`) ?? null
                  const prev = prevSeason ? realMap.get(`${prevSeason.id}|${focus.id}|${mo.idx}`) ?? null : null
                  const dev = deviation(real, bud)
                  const status = deviationStatus(real, bud, focus.better_direction)
                  return (
                    <tr key={mo.idx} className={ri % 2 ? 'bg-campo-50/30' : 'bg-white'}>
                      <td className="px-4 py-2 border-b border-black/5 font-semibold text-campo-800">{monthLong(mo.idx, lang)}</td>
                      <td className="px-3 py-2 border-b border-black/5 text-right tabular-nums text-campo-700/60">{fmtNumber(bud, focus.decimals)}</td>
                      <td className="px-3 py-2 border-b border-black/5 text-right tabular-nums font-bold text-campo-800">{fmtNumber(real, focus.decimals)}</td>
                      <td className={`px-3 py-2 border-b border-black/5 text-right tabular-nums ${statusText[status]}`}>
                        {dev.abs !== null ? (dev.abs > 0 ? '+' : '') + fmtNumber(dev.abs, focus.decimals) : '—'}
                      </td>
                      <td className={`px-3 py-2 border-b border-black/5 text-right tabular-nums font-semibold ${statusText[status]}`}>
                        {dev.pct !== null ? (dev.pct > 0 ? '+' : '') + fmtNumber(dev.pct * 100, 1) + '%' : '—'}
                      </td>
                      {prevSeason && (
                        <td className="px-3 py-2 border-b border-black/5 text-right tabular-nums text-campo-700/50">{fmtNumber(prev, focus.decimals)}</td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
