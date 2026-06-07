import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './auth/AuthProvider'
import Login from './auth/Login'
import Layout from './components/Layout'
import { SeasonProvider } from './data/season'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const CargaSemanal = lazy(() => import('./pages/CargaSemanal'))
const Presupuesto = lazy(() => import('./pages/Presupuesto'))
const Indicadores = lazy(() => import('./pages/Indicadores'))
const ImportExport = lazy(() => import('./pages/ImportExport'))

function Fallback() {
  return (
    <div className="grid place-items-center py-20 text-campo-600">
      <Loader2 className="animate-spin" size={26} />
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-campo-600">
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <SeasonProvider>
      <Layout>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/carga" element={<CargaSemanal />} />
            <Route path="/presupuesto" element={<Presupuesto />} />
            <Route path="/indicadores" element={<Indicadores />} />
            <Route path="/datos" element={<ImportExport />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </SeasonProvider>
  )
}
