"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useStudioPersonas } from "@/lib/studio-data-provider";
import type { AiPersonaProfile } from "@/types/studio";

interface PersonaDraft {
  name: string;
  ageRange: string;
  styleVibe: string;
  audienceFit: string;
  scenarioExamples: string;
  status: AiPersonaProfile["status"];
}

interface FieldShellProps {
  label: string;
  helperText: string;
  children: React.ReactNode;
}

const MAX_PERSONAS = 5;

const inputClasses =
  "mt-2 w-full rounded-2xl border border-border/80 bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

const photoThemes = [
  "from-[#ead9c1] via-[#f7efe4] to-[#d4c4ae]",
  "from-[#dce7df] via-[#f5f7f3] to-[#c2d1c6]",
  "from-[#ead7de] via-[#faf1f4] to-[#d7c0ca]",
  "from-[#d9dee9] via-[#f2f5fb] to-[#c8d0e0]",
  "from-[#e6ddce] via-[#faf7f0] to-[#d8c9b0]",
];

function createEmptyDraft(): PersonaDraft {
  return {
    name: "",
    ageRange: "",
    styleVibe: "",
    audienceFit: "",
    scenarioExamples: "",
    status: "Active",
  };
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "AI";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function buildDraftFromPersona(persona: AiPersonaProfile): PersonaDraft {
  return {
    name: persona.name,
    ageRange: persona.ageRange,
    styleVibe: persona.styleVibe,
    audienceFit: persona.audienceFit,
    scenarioExamples: persona.scenarioExamples.join("\n"),
    status: persona.status,
  };
}

function buildPersonaFromDraft(
  draft: PersonaDraft,
  id: string,
): AiPersonaProfile {
  return {
    id,
    name: draft.name.trim(),
    ageRange: draft.ageRange.trim(),
    styleVibe: draft.styleVibe.trim(),
    audienceFit: draft.audienceFit.trim(),
    scenarioExamples: splitLines(draft.scenarioExamples),
    status: draft.status,
  };
}

function createPersonaId() {
  return `persona-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function FieldShell({ label, helperText, children }: FieldShellProps) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
        {helperText}
      </span>
      {children}
    </label>
  );
}

function PersonaPhotoPlaceholder({
  name,
  index,
}: {
  name: string;
  index: number;
}) {
  return (
    <div
      className={`rounded-[24px] bg-gradient-to-br ${photoThemes[index % photoThemes.length]} p-4`}
    >
      <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-[20px] border border-white/50 bg-white/20">
        <div className="absolute inset-x-8 bottom-0 h-24 rounded-t-[999px] bg-white/25" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/65 bg-white/55 text-xl font-semibold text-foreground shadow-sm">
          {getInitials(name)}
        </div>
        <p className="absolute bottom-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Photo placeholder
        </p>
      </div>
    </div>
  );
}

export function PersonasPanel() {
  const { createPersona, deletePersona, personas, resetPersonas, updatePersona } =
    useStudioPersonas();
  const [draft, setDraft] = useState<PersonaDraft>(createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);

  const personaCount = personas.length;
  const limitReached = personaCount >= MAX_PERSONAS;
  const formIsValid =
    draft.name.trim().length > 0 &&
    draft.ageRange.trim().length > 0 &&
    draft.styleVibe.trim().length > 0 &&
    draft.audienceFit.trim().length > 0 &&
    splitLines(draft.scenarioExamples).length > 0;

  function updateDraft(field: keyof PersonaDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setDraft(createEmptyDraft());
    setEditingId(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formIsValid) {
      return;
    }

    if (editingId) {
      await updatePersona(buildPersonaFromDraft(draft, editingId));
      resetForm();
      return;
    }

    if (limitReached) {
      return;
    }

    await createPersona(buildPersonaFromDraft(draft, createPersonaId()));
    resetForm();
  }

  function handleEdit(persona: AiPersonaProfile) {
    setEditingId(persona.id);
    setDraft(buildDraftFromPersona(persona));
  }

  async function handleRemove(personaId: string) {
    await deletePersona(personaId);

    if (editingId === personaId) {
      resetForm();
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-border/80 bg-accent-soft/45 px-5 py-4">
        <p className="text-sm font-semibold text-foreground">Persona guide</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          A persona is a fictional model profile we use to present jewelry in different styles while staying consistent with the brand.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title={editingId ? "Edit persona" : "Create persona"}
          description="Use this form to shape up to five reusable AI personas for styling, audience targeting, and creative scenarios."
        >
          <form
            className="space-y-5"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell
                label="Name"
                helperText="Choose a simple first name or label the team can quickly recognize."
              >
                <input
                  className={inputClasses}
                  type="text"
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Age range"
                helperText="Write the general age band this persona represents, such as 28-34 or 35-45."
              >
                <input
                  className={inputClasses}
                  type="text"
                  value={draft.ageRange}
                  onChange={(event) => updateDraft("ageRange", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Style vibe"
                helperText="Describe the overall fashion mood, such as minimal, romantic, polished, bold, or artistic."
              >
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={draft.styleVibe}
                  onChange={(event) => updateDraft("styleVibe", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Audience fit"
                helperText="Explain which type of customer this persona helps you speak to best."
              >
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={draft.audienceFit}
                  onChange={(event) => updateDraft("audienceFit", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Scenario examples"
                helperText="Add a few content or styling situations this persona would be useful for. Put each example on its own line."
              >
                <textarea
                  className={inputClasses}
                  rows={6}
                  value={draft.scenarioExamples}
                  onChange={(event) => updateDraft("scenarioExamples", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Status"
                helperText="Set the persona to active if the team should use it now, or inactive if it is just saved for reference."
              >
                <select
                  className={inputClasses}
                  value={draft.status}
                  onChange={(event) =>
                    updateDraft("status", event.target.value as AiPersonaProfile["status"])
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </FieldShell>
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border border-border/80 bg-white/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {personaCount} of {MAX_PERSONAS} personas saved
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Persona data is saved locally in this browser for now, so it stays in mock local state until a real backend is added.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {editingId ? (
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                    onClick={resetForm}
                    type="button"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!formIsValid || (!editingId && limitReached)}
                  type="submit"
                >
                  {editingId ? "Update persona" : "Create persona"}
                </button>
              </div>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Persona library"
          description="Review your saved fictional model profiles, each with a placeholder photo card and quick-use styling context."
          className="h-fit"
        >
          <div className="space-y-4">
            <div className="rounded-[24px] border border-border/80 bg-accent-soft/35 px-4 py-4">
              <p className="text-sm font-semibold text-foreground">Current limit</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                You can save up to five AI personas in this first version. Remove one to free up a slot if needed.
              </p>
            </div>

            <button
              className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
              onClick={() => {
                void resetPersonas();
                resetForm();
              }}
              type="button"
            >
              Reset to sample personas
            </button>
          </div>
        </SectionCard>
      </div>

      {personas.length === 0 ? (
        <EmptyState
          title="No personas created yet"
          description="Create your first fictional model profile to start building a reusable persona library."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((persona, index) => (
            <SectionCard
              key={persona.id}
              title={persona.name}
              description={`${persona.ageRange} · ${persona.styleVibe}`}
            >
              <div className="space-y-4">
                <PersonaPhotoPlaceholder index={index} name={persona.name} />

                <div className="flex items-center justify-between gap-3">
                  <StatusBadge value={persona.status} />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Persona {index + 1}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Audience fit
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {persona.audienceFit}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Scenario examples
                  </p>
                  <div className="mt-3 space-y-2">
                    {persona.scenarioExamples.map((example) => (
                      <div
                        key={example}
                        className="rounded-[18px] border border-border/80 bg-white/75 px-3 py-3 text-sm leading-6 text-foreground"
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                    onClick={() => handleEdit(persona)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15"
                    onClick={() => {
                      void handleRemove(persona.id);
                    }}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
