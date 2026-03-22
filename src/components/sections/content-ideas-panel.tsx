"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatLongDate } from "@/lib/format";
import type { ContentIdea } from "@/types/studio";

interface ContentIdeasPanelProps {
  ideas: ContentIdea[];
}

export function ContentIdeasPanel({ ideas }: ContentIdeasPanelProps) {
  const [search, setSearch] = useState("");
  const [persona, setPersona] = useState("all");
  const [status, setStatus] = useState("all");

  const personaOptions = Array.from(new Set(ideas.map((idea) => idea.personaName)));

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      search.length === 0 ||
      [
        idea.title,
        idea.theme,
        idea.hook,
        idea.captionAngle,
        idea.products.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesPersona = persona === "all" || idea.personaName === persona;
    const matchesStatus = status === "all" || idea.status === status;

    return matchesSearch && matchesPersona && matchesStatus;
  });

  return (
    <div>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search ideas, hooks, or products"
        filters={[
          {
            label: "Persona",
            value: persona,
            onChange: setPersona,
            options: [
              { label: "All personas", value: "all" },
              ...personaOptions.map((item) => ({ label: item, value: item })),
            ],
          },
          {
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Approved Concept", value: "Approved Concept" },
              { label: "Ready for Storyboard", value: "Ready for Storyboard" },
              { label: "Awaiting Brand Note", value: "Awaiting Brand Note" },
            ],
          },
        ]}
        summary={`${filteredIdeas.length} idea${filteredIdeas.length === 1 ? "" : "s"} in view`}
      />

      {filteredIdeas.length === 0 ? (
        <EmptyState
          title="No content ideas match this view"
          description="Try widening the filters to see the full mock idea pipeline."
        />
      ) : (
        <div className="space-y-5">
          {filteredIdeas.map((idea) => (
            <SectionCard
              key={idea.id}
              title={idea.title}
              description={`${idea.personaName} · ${idea.theme}`}
            >
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={idea.status} />
                    <StatusBadge value={`${idea.priority} priority`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Hook
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">{idea.hook}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Concept
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {idea.concept}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Caption angle
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {idea.captionAngle}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 rounded-[24px] border border-border/80 bg-accent-soft/35 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Target launch
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {formatLongDate(idea.targetLaunch)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Product focus
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {idea.products.map((product) => (
                        <span
                          key={product}
                          className="rounded-full border border-border/80 bg-white/80 px-3 py-1 text-xs font-semibold text-foreground"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
