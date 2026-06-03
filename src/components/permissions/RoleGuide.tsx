import { useState } from 'react'
import { ChevronDown, Shield } from 'lucide-react'
import { ROLE_META } from './roleConfig'

export function RoleGuide() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02] transition-colors focus-ring"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-accent" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-text-primary">How roles work</p>
            <p className="text-[12px] text-text-tertiary truncate">
              Admin · Team lead · Employee — what each can do
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-text-tertiary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 grid gap-3 sm:grid-cols-3 border-t border-black/[0.06] pt-4">
          {ROLE_META.map((role) => (
            <div
              key={role.value}
              className="rounded-xl border border-black/[0.06] bg-canvas px-3.5 py-3"
            >
              <p className="text-[13px] font-semibold text-text-primary">{role.label}</p>
              <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{role.description}</p>
              <ul className="mt-2.5 space-y-1">
                {role.capabilities.map((cap) => (
                  <li key={cap} className="text-[11px] text-text-tertiary flex gap-1.5 leading-snug">
                    <span className="text-accent shrink-0">·</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
