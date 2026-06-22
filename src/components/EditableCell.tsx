import { useEffect, useRef, useState } from 'react'
import { parseNum } from '../lib/format'

interface Props {
  value: number | null | undefined
  onCommit: (value: number | null) => void
  decimals?: number
  className?: string
  placeholder?: string
}

// Celda numérica con autosave: guarda al perder foco o con Enter.
export default function EditableCell({ value, onCommit, className = '', placeholder = '' }: Props) {
  const [text, setText] = useState(toText(value))
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setText(toText(value))
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    const parsed = parseNum(text)
    // Si hay texto pero no parsea (typo), no borramos el dato: revertimos al valor previo.
    if (text.trim() !== '' && parsed === null) {
      setText(toText(value))
      return
    }
    const current = value ?? null
    if (parsed !== current) onCommit(parsed)
  }

  return (
    <input
      ref={ref}
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onFocus={() => {
        setEditing(true)
        requestAnimationFrame(() => ref.current?.select())
      }}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          setText(toText(value))
          setEditing(false)
          e.currentTarget.blur()
        }
      }}
      className={`cell-input ${className}`}
    />
  )
}

function toText(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return ''
  // mostrar con coma decimal (es-AR) pero sin forzar decimales fijos
  return String(v).replace('.', ',')
}
