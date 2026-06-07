import { useState } from 'react'
import { Milk, Loader2, LogIn } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('juangori@gmail.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(traducir(error))
    setBusy(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-campo-100 via-[#f6f7f4] to-campo-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-campo-600 text-white grid place-items-center shadow-lg shadow-campo-600/20">
            <Milk size={32} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-campo-800">Tablero Lechero</h1>
          <p className="text-sm text-campo-700/70">Campo Norte · La Elvira</p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Email</label>
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
            <label className="label">Contraseña</label>
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
            Entrar
          </button>
        </form>
        <p className="text-center text-xs text-campo-700/50 mt-4">
          Acceso privado. Tus datos están protegidos.
        </p>
      </div>
    </div>
  )
}

function traducir(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Email o contraseña incorrectos.'
  if (/email not confirmed/i.test(msg)) return 'El email no está confirmado.'
  return msg
}
