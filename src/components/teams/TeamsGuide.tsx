export function TeamsGuide() {
  return (
    <div className="rounded-card border border-border bg-surface p-5 space-y-3 text-caption text-text-secondary">
      <h3 className="text-headline text-text-primary">How teams work</h3>
      <ul className="space-y-2 list-disc pl-4">
        <li>Each person belongs to <strong className="text-text-primary font-medium">one team</strong> at a time.</li>
        <li>
          <strong className="text-text-primary font-medium">Company Brain</strong> shows shared knowledge plus private
          nodes for your team.
        </li>
        <li>
          <strong className="text-text-primary font-medium">Team Brain</strong> filters the graph to your team&apos;s
          context only.
        </li>
        <li>
          Mark a team <strong className="text-text-primary font-medium">private</strong> to hide it from people not on
          that team (admins always see everything).
        </li>
        <li>Team leads can invite and manage members on their own team; admins manage all teams.</li>
      </ul>
    </div>
  )
}
