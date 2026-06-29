import { useState } from 'react'
import { Loader2, LogIn } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useI18n } from '../lib/i18n'
import LangToggle from '../components/LangToggle'
import CowIcon from '../components/CowIcon'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('juangori@gmail.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(translateError(error, t))
    setBusy(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-campo-100 via-[#f6f7f4] to-campo-50">
      <div className="absolute top-4 right-4">
        <LangToggle variant="light" />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-campo-600 text-white grid place-items-center shadow-lg shadow-campo-600/20">
            <CowIcon size={38} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-campo-800">{t('app.name')}</h1>
          <p className="text-sm text-campo-700/70">{t('login.brandSub')}</p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">{t('login.email')}</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label">{t('login.password')}</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
            {t('login.submit')}
          </button>
        </form>
        <p className="text-center text-xs text-campo-700/50 mt-4">{t('login.footer')}</p>
      </div>
    </div>
  )
}

function translateError(msg: string, t: (k: string) => string): string {
  if (/invalid login credentials/i.test(msg)) return t('login.err.invalid')
  if (/email not confirmed/i.test(msg)) return t('login.err.unconfirmed')
  return msg
}
