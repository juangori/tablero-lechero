import { useMemo, useState } from 'react'
import { CalendarPlus, Copy, Target } from 'lucide-react'
import { PageHeader, Spinner, EmptyState, Modal } from '../components/ui'
import EditableCell from '../components/EditableCell'
import { MONTHS, seasonNameFromStart } from '../lib/months'
import { fmtNumber } from '../lib/format'
import { useSeason } from '../data/season'
import {
  useBudgets,
  useCopyBudget,
  useCreateSeason,
  useIndicators,
  useSetActiveSeason,
  useUpsertBudget,
} from '../data/queries'

export default function Presupuesto() {
  const { seasons, selected, selectedId, setSelectedId } = useSeason()
  const { data: indicators = [], isLoading: li } = useIndicators()
  const { data: budgets = [], isLoading: lb } = useBudgets(selectedId)
  const upsert = useUpsertBudget()
  const [showNew, setShowNew] = useState(false)
  const [showCopy, setShowCopy] = useState(false)

  // mapa rápido: indicator|month -> value
  const map = useMemo(() => {
    const m = new Map<string, number | null>()
    for (const b of budgets) m.set(`${b.indicator_id}|${b.month_index}`, b.value)
    return m
  }, [budgets])

  const rowAvg = (indId: string) => {
    const vals = MONTHS.map((mo) => map.get(`${indId}|${mo.idx}`)).filter(
      (v): v is number => v !== null && v !== undefined,
    )
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  if (!seasons.length) {
    return (
      <div>
        <PageHeader title="Presupuesto" />
        <EmptyState icon={<Target size={40} />} title="Creá tu primer ejercicio">
          <p className="mb-4">
            El presupuesto se arma una vez al año, mes a mes. Empezá creando un ejercicio (ej. 24-25).
          </p>
          <button className="btn-primary mx-auto" onClick={() => setShowNew(true)}>
            <CalendarPlus size={18} /> Nuevo ejercicio
          </button>
        </EmptyState>
        <NewSeasonModal open={showNew} onClose={() => setShowNew(false)} onCreated={(id) => setSelectedId(id)} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Presupuesto anual"
        subtitle={`Ejercicio ${selected?.name ?? ''} · valores mensuales (jul → jun)`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setShowCopy(true)}>
              <Copy size={17} /> Copiar de otro año
            </button>
            <button className="btn-primary" onClick={() => setShowNew(true)}>
              <CalendarPlus size={17} /> Nuevo ejercicio
            </button>
          </>
        }
      />

      {li || lb ? (
        <Spinner label="Cargando presupuesto…" />
      ) : !indicators.length ? (
        <EmptyState icon={<Target size={40} />} title="No hay indicadores activos">
          Andá a <b>Indicadores</b> y creá o activá los que quieras presupuestar.
        </EmptyState>
      ) : (
        <div className="card overflow-x-auto scroll-x">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-campo-50 text-left font-semibold text-campo-800 px-4 py-3 border-b border-black/5 min-w-[200px]">
                  Indicador
                </th>
                {MONTHS.map((mo) => (
                  <th key={mo.idx} className="bg-campo-50 text-campo-700/70 font-semibold px-2 py-3 border-b border-black/5 text-center min-w-[68px]">
                    {mo.short}
                  </th>
                ))}
                <th className="bg-campo-100 text-campo-800 font-bold px-3 py-3 border-b border-black/5 text-center min-w-[80px]">
                  Prom.
                </th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((ind, ri) => (
                <tr key={ind.id} className={ri % 2 ? 'bg-campo-50/30' : 'bg-white'}>
                  <td className={`sticky left-0 z-10 ${ri % 2 ? 'bg-[#f4f7f1]' : 'bg-white'} px-4 py-2 border-b border-black/5`}>
                    <div className="font-semibold text-campo-800 leading-tight">{ind.name}</div>
                    {ind.unit && <div className="text-[11px] text-campo-700/50">{ind.unit}</div>}
                  </td>
                  {MONTHS.map((mo) => (
                    <td key={mo.idx} className="border-b border-black/5 px-1">
                      <EditableCell
                        value={map.get(`${ind.id}|${mo.idx}`)}
                        onCommit={(v) =>
                          upsert.mutate({
                            season_id: selectedId!,
                            indicator_id: ind.id,
                            month_index: mo.idx,
                            value: v,
                          })
                        }
                      />
                    </td>
                  ))}
                  <td className="border-b border-black/5 px-3 text-right font-bold tabular-nums text-campo-800 bg-campo-50/40">
                    {fmtNumber(rowAvg(ind.id), ind.decimals)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-campo-700/50 mt-3 px-1">
        Se guarda solo al salir de cada celda. Tip: presioná <b>Enter</b> para confirmar y pasar.
      </p>

      <NewSeasonModal open={showNew} onClose={() => setShowNew(false)} onCreated={(id) => setSelectedId(id)} />
      <CopyBudgetModal
        open={showCopy}
        onClose={() => setShowCopy(false)}
        targetId={selectedId}
        targetName={selected?.name}
      />
    </div>
  )
}

function NewSeasonModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const create = useCreateSeason()
  const setActive = useSetActiveSeason()
  const [startYear, setStartYear] = useState(2025)
  const name = seasonNameFromStart(startYear)

  return (
    <Modal open={open} onClose={onClose} title="Nuevo ejercicio">
      <div className="space-y-3">
        <div>
          <label className="label">Año de inicio (julio)</label>
          <input
            className="input"
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
          />
        </div>
        <div className="rounded-xl bg-campo-50 px-3 py-2 text-sm text-campo-700">
          Ejercicio <b>{name}</b> · de julio {startYear} a junio {startYear + 1}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            disabled={create.isPending}
            onClick={() =>
              create.mutate(
                { name, start_year: startYear },
                {
                  onSuccess: (s) => {
                    setActive.mutate(s.id)
                    onCreated(s.id)
                    onClose()
                  },
                },
              )
            }
          >
            Crear
          </button>
        </div>
      </div>
    </Modal>
  )
}

function CopyBudgetModal({
  open,
  onClose,
  targetId,
  targetName,
}: {
  open: boolean
  onClose: () => void
  targetId: string | undefined
  targetName: string | undefined
}) {
  const { seasons } = useSeason()
  const copy = useCopyBudget()
  const [from, setFrom] = useState('')
  const options = seasons.filter((s) => s.id !== targetId)

  return (
    <Modal open={open} onClose={onClose} title={`Copiar presupuesto → ${targetName ?? ''}`}>
      <div className="space-y-3">
        <p className="text-sm text-campo-700/70">
          Copia los valores de presupuesto de otro ejercicio al actual. Después podés ajustarlos.
        </p>
        <div>
          <label className="label">Copiar desde</label>
          <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">Elegí un ejercicio…</option>
            {options.map((s) => (
              <option key={s.id} value={s.id}>
                Ejercicio {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            disabled={!from || copy.isPending}
            onClick={() =>
              copy.mutate({ from, to: targetId! }, { onSuccess: onClose })
            }
          >
            Copiar
          </button>
        </div>
      </div>
    </Modal>
  )
}
