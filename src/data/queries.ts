import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Budget, Indicator, MonthlyActual, Season, WeeklyEntry } from '../types'

/* ---------------- Indicadores ---------------- */
export function useIndicators(includeInactive = false) {
  return useQuery({
    queryKey: ['indicators', includeInactive],
    queryFn: async (): Promise<Indicator[]> => {
      let q = supabase.from('indicators').select('*').order('sort_order').order('name')
      if (!includeInactive) q = q.eq('active', true)
      const { data, error } = await q
      if (error) throw error
      return data as Indicator[]
    },
  })
}

export function useSaveIndicator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ind: Partial<Indicator>) => {
      if (ind.id) {
        const { error } = await supabase.from('indicators').update(ind).eq('id', ind.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('indicators').insert(ind)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['indicators'] }),
  })
}

export function useDeleteIndicator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('indicators').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['indicators'] })
      qc.invalidateQueries({ queryKey: ['monthly'] })
    },
  })
}

/* ---------------- Ejercicios (seasons) ---------------- */
export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: async (): Promise<Season[]> => {
      const { data, error } = await supabase.from('seasons').select('*').order('start_year')
      if (error) throw error
      return data as Season[]
    },
  })
}

export function useCreateSeason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (s: { name: string; start_year: number; active?: boolean }) => {
      const { data, error } = await supabase.from('seasons').insert(s).select().single()
      if (error) throw error
      return data as Season
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seasons'] }),
  })
}

export function useSetActiveSeason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('seasons').update({ active: false }).neq('id', id)
      const { error } = await supabase.from('seasons').update({ active: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seasons'] }),
  })
}

/* ---------------- Presupuesto ---------------- */
export function useBudgets(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['budgets', seasonId],
    enabled: !!seasonId,
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase.from('budgets').select('*').eq('season_id', seasonId!)
      if (error) throw error
      return data as Budget[]
    },
  })
}

export function useUpsertBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: {
      season_id: string
      indicator_id: string
      month_index: number
      value: number | null
    }) => {
      const { error } = await supabase
        .from('budgets')
        .upsert(row, { onConflict: 'season_id,indicator_id,month_index' })
      if (error) throw error
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['budgets', v.season_id] }),
  })
}

export function useCopyBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const { data, error } = await supabase.from('budgets').select('*').eq('season_id', from)
      if (error) throw error
      const rows = (data as Budget[]).map((b) => ({
        season_id: to,
        indicator_id: b.indicator_id,
        month_index: b.month_index,
        value: b.value,
      }))
      if (rows.length) {
        const { error: e2 } = await supabase
          .from('budgets')
          .upsert(rows, { onConflict: 'season_id,indicator_id,month_index' })
        if (e2) throw e2
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['budgets', v.to] }),
  })
}

/* ---------------- Carga semanal ---------------- */
export function useWeeklyEntries(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['weekly', seasonId],
    enabled: !!seasonId,
    queryFn: async (): Promise<WeeklyEntry[]> => {
      const { data, error } = await supabase
        .from('weekly_entries')
        .select('*')
        .eq('season_id', seasonId!)
      if (error) throw error
      return data as WeeklyEntry[]
    },
  })
}

export function useUpsertWeekly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: {
      season_id: string
      indicator_id: string
      month_index: number
      week_index: number
      value: number | null
      entry_date?: string | null
    }) => {
      const { error } = await supabase
        .from('weekly_entries')
        .upsert(
          { ...row, updated_at: new Date().toISOString() },
          { onConflict: 'season_id,indicator_id,month_index,week_index' },
        )
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['weekly', v.season_id] })
      qc.invalidateQueries({ queryKey: ['monthly'] })
    },
  })
}

/* ---------------- Real mensual (vista) ---------------- */
export function useMonthlyActuals() {
  return useQuery({
    queryKey: ['monthly'],
    queryFn: async (): Promise<MonthlyActual[]> => {
      const { data, error } = await supabase.from('monthly_actuals').select('*')
      if (error) throw error
      return data as MonthlyActual[]
    },
  })
}
