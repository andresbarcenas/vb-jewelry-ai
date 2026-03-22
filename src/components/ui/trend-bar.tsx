interface TrendBarProps {
  label: string;
  value: number;
  maxValue: number;
  helper?: string;
}

export function TrendBar({ label, value, maxValue, helper }: TrendBarProps) {
  const width = Math.max((value / maxValue) * 100, 8);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        <span className="text-sm font-semibold text-accent">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-accent-soft/60">
        <div
          className="h-2 rounded-full bg-[linear-gradient(90deg,#8f6c45,#c9ad84)]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
