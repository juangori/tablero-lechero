import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, SlidersHorizontal, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useDeleteIndicator, useIndicators, useSaveIndicator } from '../data/queries'
import { DEFAULT_INDICATORS } from '../data/defaults'
import { CATEGORIES, type BetterDirection, type Indicator } from '../types'
import { PageHeader, Spinner, EmptyState, Modal, Badge } from '../components/ui'
import { supabase } from '../lib/supabase'

const DIR_LABEL: Record<BetterDirection, string> = {
  higher: 'Más es mejor',
  lower: 'Menos es mejor',
  none: 'Neutro',
}
const DIR_BADGE: Record<BetterDirection, string> = {
  higher: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  lower: 'bg-amber-50 text-amber-700 ring-amber-200',
  none: 'bg-campo-50 text-campo-700/70 ring-campo-200',
}

const empty: Partial<Indicator> = {
  name: '',
  unit: '',
  category: 'Producción',
  decimals: 1,
  better_direction: 'higher',
  is_percent: false,
  active: true,
  sort_order: 999,
}

export default function Indicadores() {
  const { data: indicators, isLoading } = useIndicators(true)
  const save = useSaveIndicator()
  const del = useDeleteIndicator()
  const [editing, setEditing] = useState<Partial<Indicator> | null>(null)
  const [seeding, setSeeding] = useState(false)

  const grouped = useMemo(() => {
    const g: Record<string, Indicator[]> = {}
    for (const i of indicators ?? []) {
      ;(g[i.category] ??= []).push(i)
    }
    return g
  }, [indicators])

  const seedDefaults = async () => {
    setSeeding(true)
    await supabase.from('indicators').insert(
      DEFAULT_INDICATORS.map((d) => ({ ...d, is_percent: false, active: true })),
    )
    await new Promise((r) => setTimeout(r, 300))
    window.location.reload()
  }

  if (isLoading) return <Spinner label="Cargando indicadores…" />

  return (
    <div>
      <PageHeader
        title="Indicadores"
        subtitle="Elegí qué medir. Agregá, editá o desactivá los indicadores que quieras."
        actions={
          <button className="btn-primary" onClick={() => setEditing({ ...empty })}>
            <Plus size={18} /> Nuevo indicador
          </button>
        }
      />

      {!indicators?.length ? (
        <EmptyState
          icon={<SlidersHorizontal size={40} />}
          title="Todavía no hay indicadores"
        >
          <p className="mb-4">Podés crear uno a uno, o cargar la lista típica de un tambo para arrancar.</p>
          <button className="btn-primary mx-auto" onClick={seedDefaults} disabled={seeding}>
            <Sparkles size={18} /> Cargar indicadores típicos
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-campo-700/50 mb-2 px-1">{cat}</h2>
              <div className="card divide-y divide-black/5">
                {items.map((ind) => (
                  <div key={ind.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${ind.active ? 'text-campo-800' : 'text-campo-700/40 line-through'}`}>
                          {ind.name}
                        </span>
                        {ind.unit && <Badge className="bg-campo-50 text-campo-700/70 ring-campo-200">{ind.unit}</Badge>}
                        <Badge className={DIR_BADGE[ind.better_direction]}>{DIR_LABEL[ind.better_direction]}</Badge>
                      </div>
                    </div>
                    <button
                      title={ind.active ? 'Desactivar' : 'Activar'}
                      className="p-2 rounded-lg text-campo-700/50 hover:bg-campo-50"
                      onClick={() => save.mutate({ id: ind.id, active: !ind.active })}
                    >
                      {ind.active ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                    <button
                      className="p-2 rounded-lg text-campo-700/60 hover:bg-campo-50"
                      onClick={() => setEditing(ind)}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`¿Eliminar "${ind.name}"? Se borran sus presupuestos y datos cargados.`))
                          del.mutate(ind.id)
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <IndicatorModal
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={(v) => {
          save.mutate(v, { onSuccess: () => setEditing(null) })
        }}
        saving={save.isPending}
      />
    </div>
  )
}

function IndicatorModal({
  editing,
  onClose,
  onSave,
  saving,
}: {
  editing: Partial<Indicator> | null
  onClose: () => void
  onSave: (v: Partial<Indicator>) => void
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<Indicator>>(editing ?? empty)
  // sincronizar cuando cambia editing
  useEffect(() => setForm(editing ?? empty), [editing])

  if (!editing) return null
  const set = (k: keyof Indicator, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal open={!!editing} onClose={onClose} title={editing.id ? 'Editar indicador' : 'Nuevo indicador'}>
      <div className="space-y-3">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Unidad</label>
            <input className="input" value={form.unit ?? ''} placeholder="kg MS, %, US$…" onChange={(e) => set('unit', e.target.value)} />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Decimales</label>
            <input
              className="input"
              type="number"
              min={0}
              max={4}
              value={form.decimals ?? 1}
              onChange={(e) => set('decimals', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Sentido</label>
            <select
              className="input"
              value={form.better_direction}
              onChange={(e) => set('better_direction', e.target.value as BetterDirection)}
            >
              <option value="higher">Más es mejor</option>
              <option value="lower">Menos es mejor</option>
              <option value="none">Neutro</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            disabled={saving || !form.name?.trim()}
            onClick={() => onSave(form)}
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  )
}
