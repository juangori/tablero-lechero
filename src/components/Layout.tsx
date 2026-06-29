import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardPen,
  Target,
  SlidersHorizontal,
  FileSpreadsheet,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useSeason } from '../data/season'
import { useI18n } from '../lib/i18n'
import LangToggle from './LangToggle'
import CowIcon from './CowIcon'

const NAV: { to: string; key: string; icon: typeof LayoutDashboard; end?: boolean }[] = [
  { to: '/', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/carga', key: 'nav.weekly', icon: ClipboardPen },
  { to: '/presupuesto', key: 'nav.budget', icon: Target },
  { to: '/indicadores', key: 'nav.indicators', icon: SlidersHorizontal },
  { to: '/datos', key: 'nav.data', icon: FileSpreadsheet },
]

function SeasonSelector() {
  const { seasons, selectedId, setSelectedId } = useSeason()
  const { t } = useI18n()
  if (!seasons.length) return null
  return (
    <div className="relative">
      <select
        value={selectedId ?? ''}
        onChange={(e) => setSelectedId(e.target.value)}
        className="appearance-none rounded-xl bg-white/15 text-white text-sm font-semibold pl-3 pr-8 py-1.5 outline-none ring-1 ring-white/20 hover:bg-white/20 cursor-pointer"
      >
        {[...seasons]
          .sort((a, b) => b.start_year - a.start_year)
          .map((s) => (
            <option key={s.id} value={s.id} className="text-campo-900">
              {t('season.label')} {s.name}
              {s.active ? ' ●' : ''}
            </option>
          ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80" />
    </div>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { email, signOut } = useAuth()
  const { t } = useI18n()
  const location = useLocation()

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-campo-800 text-white">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <div className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center">
            <CowIcon size={22} />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold">{t('app.name')}</div>
            <div className="text-[11px] text-white/60">{t('app.place')}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <n.icon size={18} />
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-2 text-xs text-white/50 truncate mb-2">{email}</div>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut size={18} />
            {t('common.signOut')}
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="md:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-campo-700 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 md:px-8 h-16">
            <div className="md:hidden flex items-center gap-2">
              <CowIcon size={24} />
              <span className="font-extrabold">{t('app.name')}</span>
            </div>
            <div className="hidden md:block text-sm text-white/70">
              {(() => {
                const cur = NAV.find((n) =>
                  n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
                )
                return cur ? t(cur.key) : ''
              })()}
            </div>
            <div className="flex items-center gap-2">
              <LangToggle />
              <SeasonSelector />
              <button
                onClick={signOut}
                title={t('common.signOut')}
                className="md:hidden grid place-items-center h-8 w-8 rounded-xl bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-5 pb-24 md:pb-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom nav móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-black/5 grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
                isActive ? 'text-campo-700' : 'text-campo-700/45'
              }`
            }
          >
            <n.icon size={20} />
            {t(n.key).split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
