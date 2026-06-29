import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, SlidersHorizontal, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useDeleteIndicator, useIndicators, useSaveIndicator } from '../data/queries'
import { DEFAULT_INDICATORS } from '../data/defaults'
import { CATEGORIES, type Aggregation, type BetterDirection, type Indicator } from '../types'
import { PageHeader, Spinner, EmptyState, Modal, Badge } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useI18n, rich } from '../lib/i18n'

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
  aggregation: 'avg',
  active: true,
  sort_order: 999,
}

export default function Indicadores() {
  const { t, tCat, tInd, tUnit } = useI18n()
  const qc = useQueryClient()
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
    await supabase.from('indicators').insert(DEFAULT_INDICATORS.map((d) => ({ ...d, active: true })))
    await qc.invalidateQueries({ queryKey: ['indicators'] })
    setSeeding(false)
  }

  if (isLoading) return <Spinner label={t('ind.loading')} />

  return (
    <div>
      <PageHeader
        title={t('ind.title')}
        subtitle={t('ind.subtitle')}
        actions={
          <button className="btn-primary" onClick={() => setEditing({ ...empty })}>
            <Plus size={18} /> {t('ind.new')}
          </button>
        }
      />

      {!indicators?.length ? (
        <EmptyState
          icon={<SlidersHorizontal size={40} />}
          title={t('ind.empty.title')}
        >
          <p className="mb-4">{t('ind.empty.body')}</p>
          <button className="btn-primary mx-auto" onClick={seedDefaults} disabled={seeding}>
            <Sparkles size={18} /> {t('ind.empty.seed')}
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-campo-700/50 mb-2 px-1">{tCat(cat)}</h2>
              <div className="card divide-y divide-black/5">
                {items.map((ind) => (
                  <div key={ind.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${ind.active ? 'text-campo-800' : 'text-campo-700/40 line-through'}`}>
                          {tInd(ind.name)}
                        </span>
                        {ind.unit && <Badge className="bg-campo-50 text-campo-700/70 ring-campo-200">{tUnit(ind.unit)}</Badge>}
                        <Badge className={DIR_BADGE[ind.better_direction]}>{t('dir.' + ind.better_direction)}</Badge>
                      </div>
                    </div>
                    <button
                      title={ind.active ? t('ind.deactivate') : t('ind.activate')}
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
                        if (confirm(t('ind.delete.confirm', { name: tInd(ind.name) })))
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
  const { t, tCat } = useI18n()
  const [form, setForm] = useState<Partial<Indicator>>(editing ?? empty)
  // sincronizar cuando cambia editing
  useEffect(() => setForm(editing ?? empty), [editing])

  if (!editing) return null
  const set = (k: keyof Indicator, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal open={!!editing} onClose={onClose} title={editing.id ? t('ind.modal.edit') : t('ind.modal.new')}>
      <div className="space-y-3">
        <div>
          <label className="label">{t('ind.f.name')}</label>
          <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('ind.f.unit')}</label>
            <input className="input" value={form.unit ?? ''} placeholder={t('ind.f.unit.ph')} onChange={(e) => set('unit', e.target.value)} />
          </div>
          <div>
            <label className="label">{t('ind.f.category')}</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{tCat(c)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('ind.f.decimals')}</label>
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
            <label className="label">{t('ind.f.direction')}</label>
            <select
              className="input"
              value={form.better_direction}
              onChange={(e) => set('better_direction', e.target.value as BetterDirection)}
            >
              <option value="higher">{t('dir.higher')}</option>
              <option value="lower">{t('dir.lower')}</option>
              <option value="none">{t('dir.none')}</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">{t('ind.f.aggregation')}</label>
          <select
            className="input"
            value={form.aggregation ?? 'avg'}
            onChange={(e) => set('aggregation', e.target.value as Aggregation)}
          >
            <option value="avg">{t('agg.avg')}</option>
            <option value="sum">{t('agg.sum')}</option>
            <option value="last">{t('agg.last')}</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="btn-primary"
            disabled={saving || !form.name?.trim()}
            onClick={() => onSave(form)}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
