export function MemberAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2) ?? '?').toUpperCase()

  return (
    <div
      className="w-10 h-10 rounded-full bg-accent/10 text-accent text-[13px] font-semibold flex items-center justify-center shrink-0"
      aria-hidden
    >
      {initials}
    </div>
  )
}
