"use client";

import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-[28px] border border-border/80 bg-white/80 p-5 shadow-[0_18px_45px_rgba(68,52,35,0.08)] backdrop-blur-sm sm:p-6 ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
