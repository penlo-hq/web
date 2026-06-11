type Props = {
  name?: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-8 h-8 text-[11px]', lg: 'w-10 h-10 text-[13px]' }

function initials(name?: string): string {
  if (!name) return '?'
  return name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

export function Avatar({ name, src, size = 'md', className = '' }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s avatar` : 'User avatar'}
        className={`rounded-full object-cover bg-accent-tint ${sizes[size]} ${className}`}
      />
    )
  }
  return (
    <div
      className={`rounded-full bg-accent-tint text-accent flex items-center justify-center font-semibold shrink-0 ${sizes[size]} ${className}`}
      aria-hidden={!name}
      title={name}
    >
      {initials(name)}
    </div>
  )
}
