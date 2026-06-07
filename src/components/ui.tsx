import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-campo-700/60">
      <Loader2 className="animate-spin" size={20} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <div className="card p-10 text-center">
      {icon && <div className="mx-auto mb-3 text-campo-400">{icon}</div>}
      <h3 className="font-semibold text-campo-800">{title}</h3>
      {children && <div className="mt-1 text-sm text-campo-700/60 max-w-md mx-auto">{children}</div>}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-extrabold text-campo-800">{title}</h1>
        {subtitle && <p className="text-sm text-campo-700/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Badge({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-campo-800 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}
