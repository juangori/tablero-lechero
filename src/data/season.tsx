import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSeasons } from './queries'
import type { Season } from '../types'

interface SeasonCtx {
  seasons: Season[]
  loading: boolean
  selected: Season | undefined
  selectedId: string | undefined
  setSelectedId: (id: string) => void
}

const Ctx = createContext<SeasonCtx>(null as unknown as SeasonCtx)

export function SeasonProvider({ children }: { children: ReactNode }) {
  const { data: seasons = [], isLoading } = useSeasons()
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedId && seasons.length) {
      const active = seasons.find((s) => s.active)
      const latest = [...seasons].sort((a, b) => b.start_year - a.start_year)[0]
      setSelectedId((active ?? latest)?.id)
    }
  }, [seasons, selectedId])

  const selected = useMemo(() => seasons.find((s) => s.id === selectedId), [seasons, selectedId])

  return (
    <Ctx.Provider value={{ seasons, loading: isLoading, selected, selectedId, setSelectedId }}>
      {children}
    </Ctx.Provider>
  )
}

export const useSeason = () => useContext(Ctx)
