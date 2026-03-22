"use client";

interface StatusBadgeProps {
  value: string;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const normalized = value.toLowerCase();

  let classes =
    "border-border/80 bg-white text-muted-foreground";

  if (normalized.includes("inactive")) {
    classes = "border-danger/20 bg-danger/10 text-danger";
  } else if (
    normalized.includes("active") ||
    normalized.includes("approved") ||
    normalized.includes("ready") ||
    normalized.includes("live")
  ) {
    classes = "border-success/20 bg-success/10 text-success";
  } else if (
    normalized.includes("review") ||
    normalized.includes("scheduled")
  ) {
    classes = "border-warning/20 bg-warning/10 text-warning";
  } else if (
    normalized.includes("changes") ||
    normalized.includes("draft") ||
    normalized.includes("high")
  ) {
    classes = "border-danger/20 bg-danger/10 text-danger";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {value}
    </span>
  );
}
