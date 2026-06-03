import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import type { MemberRole } from '../../lib/api/endpoints'
import { ROLE_META } from './roleConfig'

type Props = {
  value: MemberRole
  disabled?: boolean
  saving?: boolean
  onChange: (role: MemberRole) => void
}

export function RoleSelect({ value, disabled, saving, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = ROLE_META.find((r) => r.value === value) ?? ROLE_META[2]

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        disabled={disabled || saving}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 min-w-[128px] px-3 py-2 rounded-xl border border-black/[0.10] bg-white text-[12px] font-medium text-text-primary hover:border-accent/30 focus-ring disabled:opacity-50 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-text-tertiary" />
        ) : null}
        <span>{current.label}</span>
        <ChevronDown className="w-4 h-4 text-text-tertiary ml-auto" />
      </button>
      {open && !disabled && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-1 z-30 w-[220px] py-1 rounded-xl border border-black/[0.10] bg-white shadow-lg"
        >
          {ROLE_META.map((role) => (
            <li key={role.value}>
              <button
                type="button"
                role="option"
                aria-selected={role.value === value}
                onClick={() => {
                  setOpen(false)
                  if (role.value !== value) onChange(role.value)
                }}
                className={`w-full text-left px-3 py-2.5 hover:bg-black/[0.03] transition-colors ${
                  role.value === value ? 'bg-accent/5' : ''
                }`}
              >
                <span className="block text-[12px] font-semibold text-text-primary">{role.label}</span>
                <span className="block text-[11px] text-text-tertiary mt-0.5 leading-snug">{role.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
