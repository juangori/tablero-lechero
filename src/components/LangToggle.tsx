import { useI18n, type Lang } from '../lib/i18n'

const LANGS: Lang[] = ['en', 'es']

/**
 * Segmento EN | ES. `variant`:
 *  - 'header' (default): sobre fondo oscuro (barra superior).
 *  - 'light': sobre fondo claro (pantalla de login).
 */
export default function LangToggle({ variant = 'header' }: { variant?: 'header' | 'light' }) {
  const { lang, setLang } = useI18n()

  const wrap =
    variant === 'header'
      ? 'bg-white/15 ring-white/20'
      : 'bg-campo-50 ring-campo-200'

  const activeCls =
    variant === 'header'
      ? 'bg-white text-campo-800 shadow-sm'
      : 'bg-campo-600 text-white shadow-sm'

  const idleCls =
    variant === 'header'
      ? 'text-white/70 hover:text-white'
      : 'text-campo-700/60 hover:text-campo-800'

  return (
    <div className={`inline-flex items-center rounded-xl p-0.5 ring-1 ${wrap}`}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-lg px-2 py-1 text-xs font-bold uppercase transition ${
            lang === l ? activeCls : idleCls
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
