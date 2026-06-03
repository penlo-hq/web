type Props = { size?: number; className?: string }

export function LiquidOrb({ size = 110, className = '' }: Props) {
  return (
    <div
      className={`relative animate-orb-pulse ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(0, 83, 214, 0.9), rgba(0, 83, 214, 0.25) 55%, transparent 75%)',
          filter: 'blur(18px)',
        }}
      />
      <div
        className="absolute inset-[15%] rounded-full"
        style={{
          background: 'rgba(0, 83, 214, 0.6)',
          filter: 'blur(22px)',
        }}
      />
      <div
        className="absolute inset-[30%] rounded-full bg-accent/80"
        style={{ filter: 'blur(8px)' }}
      />
    </div>
  )
}
