"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatShortDate } from "@/lib/format";
import type { Persona } from "@/types/studio";

interface PersonasPanelProps {
  personas: Persona[];
}

export function PersonasPanel({ personas }: PersonasPanelProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filteredPersonas = personas.filter((persona) => {
    const matchesSearch =
      search.length === 0 ||
      [
        persona.name,
        persona.roleLabel,
        persona.summary,
        persona.focus,
        persona.pillars.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus = status === "all" || persona.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search personas, roles, or themes"
        filters={[
          {
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Approved", value: "Approved" },
              { label: "Draft", value: "Draft" },
            ],
          },
        ]}
        summary={`${filteredPersonas.length} persona${filteredPersonas.length === 1 ? "" : "s"} shown`}
      />

      {filteredPersonas.length === 0 ? (
        <EmptyState
          title="No personas match these filters"
          description="Try clearing the search or switching the status filter to see the full approved roster."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredPersonas.map((persona) => (
            <SectionCard
              key={persona.id}
              title={persona.name}
              description={persona.roleLabel}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge value={persona.status} />
                  <span className="text-sm font-semibold text-accent">
                    {persona.usageShare}% usage share
                  </span>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">{persona.summary}</p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Content pillars
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {persona.pillars.map((pillar) => (
                      <span
                        key={pillar}
                        className="rounded-full border border-border/80 bg-white/80 px-3 py-1 text-xs font-semibold text-foreground"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-border/80 bg-accent-soft/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Sample hook
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {persona.sampleHook}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Adoption</span>
                    <span className="font-semibold text-foreground">
                      {persona.usageShare}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-accent-soft/55">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#8f6c45,#c9ad84)]"
                      style={{ width: `${persona.usageShare}%` }}
                    />
                  </div>
                </div>

                <dl className="grid gap-3 text-sm text-muted-foreground">
                  <div>
                    <dt className="font-semibold text-foreground">Best used for</dt>
                    <dd className="mt-1">{persona.recommendedFor}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Last used</dt>
                    <dd className="mt-1">{formatShortDate(persona.lastUsed)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Visual notes</dt>
                    <dd className="mt-1">{persona.visualNotes.join(", ")}</dd>
                  </div>
                </dl>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
