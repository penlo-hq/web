import type { SVGProps } from 'react'

type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

const markSizes = { sm: 28, md: 32, lg: 40 }

/** Penlo logomark — three connected nodes forming a knowledge-graph motif. */
export function Logomark({ size = 'md', className = '' }: { size?: LogoProps['size']; className?: string }) {
  const px = markSizes[size ?? 'md']
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
      <circle cx="11" cy="16" r="3.5" fill="white" fillOpacity="0.95" />
      <circle cx="21" cy="10" r="2.5" fill="white" fillOpacity="0.85" />
      <circle cx="21" cy="22" r="2.5" fill="white" fillOpacity="0.85" />
      <path
        d="M13.5 16 L18.5 11.5 M13.5 16 L18.5 20.5"
        stroke="white"
        strokeOpacity="0.7"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-semibold tracking-[-0.02em] text-text-primary ${className}`}
      style={{ fontFeatureSettings: '"ss01"' }}
    >
      Penlo
    </span>
  )
}

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  const textSize = size === 'sm' ? 'text-[13px]' : size === 'lg' ? 'text-[17px]' : 'text-[15px]'
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logomark size={size} />
      {showWordmark && <Wordmark className={textSize} />}
    </div>
  )
}

/** Full SVG wordmark for marketing headers (optional inline). */
export function LogoSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="0" y="0" width="32" height="32" rx="8" fill="currentColor" className="text-accent" />
      <circle cx="11" cy="16" r="3.5" fill="white" fillOpacity="0.95" />
      <circle cx="21" cy="10" r="2.5" fill="white" fillOpacity="0.85" />
      <circle cx="21" cy="22" r="2.5" fill="white" fillOpacity="0.85" />
      <path d="M13.5 16 L18.5 11.5 M13.5 16 L18.5 20.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.25" strokeLinecap="round" />
      <text x="40" y="22" fill="currentColor" fontFamily="Inter, system-ui, sans-serif" fontSize="18" fontWeight="600" letterSpacing="-0.02em">
        Penlo
      </text>
    </svg>
  )
}
