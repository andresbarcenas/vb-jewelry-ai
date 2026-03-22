interface StatCardProps {
  label: string;
  value: string;
  change: string;
  note: string;
}

export function StatCard({ label, value, change, note }: StatCardProps) {
  return (
    <div className="rounded-[28px] border border-border/80 bg-white/78 p-5 shadow-[0_18px_45px_rgba(68,52,35,0.08)] backdrop-blur-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-4xl font-semibold tracking-tight text-foreground">{value}</p>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          {change}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{note}</p>
    </div>
  );
}
