"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useStudioPersonas } from "@/lib/studio-data-provider";
import type { AiPersonaProfile, PersonaUseCaseTag } from "@/types/studio";

interface FieldShellProps {
  label: string;
  helperText: string;
  children: React.ReactNode;
}

interface PersonaDraft {
  name: string;
  label: string;
  ageRange: string;
  styleVibe: string;
  audienceFit: string;
  bestUseCases: PersonaUseCaseTag[];
  contentTone: string;
  recommendedScenes: string;
  preferredColors: string;
  jewelryFit: string;
  avoidList: string;
  promptStarter: string;
  bestContentTypes: string;
  bestMoods: string;
  bestProductCategories: string;
  status: AiPersonaProfile["status"];
}

const MAX_PERSONAS = 5;

const inputClasses =
  "mt-2 w-full rounded-2xl border border-border/80 bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

const useCaseTags: Array<{ label: string; value: PersonaUseCaseTag }> = [
  { label: "Everyday", value: "everyday" },
  { label: "Event", value: "event" },
  { label: "Handmade Story", value: "handmade story" },
  { label: "Modern Minimal", value: "modern minimal" },
];

const photoThemes = [
  "from-[#ead9c1] via-[#f7efe4] to-[#d4c4ae]",
  "from-[#dce7df] via-[#f5f7f3] to-[#c2d1c6]",
  "from-[#ead7de] via-[#faf1f4] to-[#d7c0ca]",
  "from-[#d9dee9] via-[#f2f5fb] to-[#c8d0e0]",
];

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function summarize(text: string, max = 92) {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 1).trim()}…`;
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

function createPersonaId(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `persona-${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyDraft(): PersonaDraft {
  return {
    name: "",
    label: "",
    ageRange: "",
    styleVibe: "",
    audienceFit: "",
    bestUseCases: [],
    contentTone: "",
    recommendedScenes: "",
    preferredColors: "",
    jewelryFit: "",
    avoidList: "",
    promptStarter: "",
    bestContentTypes: "",
    bestMoods: "",
    bestProductCategories: "",
    status: "active",
  };
}

function buildDraftFromPersona(persona: AiPersonaProfile): PersonaDraft {
  return {
    name: persona.name,
    label: persona.label,
    ageRange: persona.ageRange,
    styleVibe: persona.styleVibe,
    audienceFit: persona.audienceFit,
    bestUseCases: persona.bestUseCases,
    contentTone: persona.contentTone,
    recommendedScenes: persona.recommendedScenes.join("\n"),
    preferredColors: persona.preferredColors.join(", "),
    jewelryFit: persona.jewelryFit,
    avoidList: persona.avoidList.join("\n"),
    promptStarter: persona.promptStarter,
    bestContentTypes: persona.recommendedFor.bestContentTypes.join(", "),
    bestMoods: persona.recommendedFor.bestMoods.join(", "),
    bestProductCategories: persona.recommendedFor.bestProductCategories.join(", "),
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
    label: draft.label.trim(),
    ageRange: draft.ageRange.trim(),
    styleVibe: draft.styleVibe.trim(),
    audienceFit: draft.audienceFit.trim(),
    bestUseCases: draft.bestUseCases,
    contentTone: draft.contentTone.trim(),
    recommendedScenes: splitLines(draft.recommendedScenes),
    preferredColors: splitCommaList(draft.preferredColors),
    jewelryFit: draft.jewelryFit.trim(),
    avoidList: splitLines(draft.avoidList),
    promptStarter: draft.promptStarter.trim(),
    recommendedFor: {
      bestContentTypes: splitCommaList(draft.bestContentTypes),
      bestMoods: splitCommaList(draft.bestMoods),
      bestProductCategories: splitCommaList(draft.bestProductCategories),
    },
    status: draft.status,
  };
}

function buildPromptPreview(persona: AiPersonaProfile) {
  return `${persona.promptStarter}\n\nPersona notes: ${persona.styleVibe}\nAudience fit: ${persona.audienceFit}\nUse cases: ${persona.bestUseCases
    .map(toTitleCase)
    .join(", ")}\nRecommended scene: ${persona.recommendedScenes[0]}\nPreferred colors: ${persona.preferredColors.join(", ")}\nAvoid: ${persona.avoidList.join(", ")}`;
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
      <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-[20px] border border-white/50 bg-white/20">
        <div className="absolute inset-x-8 bottom-0 h-20 rounded-t-[999px] bg-white/25" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/65 bg-white/55 text-lg font-semibold text-foreground shadow-sm">
          {getInitials(name)}
        </div>
      </div>
    </div>
  );
}

export function PersonasPanel() {
  const { createPersona, deletePersona, personas, resetPersonas, updatePersona } =
    useStudioPersonas();
  const [draft, setDraft] = useState<PersonaDraft>(createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [useCaseFilter, setUseCaseFilter] = useState<"all" | PersonaUseCaseTag>("all");

  const personaCount = personas.length;
  const limitReached = personaCount >= MAX_PERSONAS;

  const filteredPersonas =
    useCaseFilter === "all"
      ? personas
      : personas.filter((persona) => persona.bestUseCases.includes(useCaseFilter));

  const activeSelectedId =
    selectedId && filteredPersonas.some((persona) => persona.id === selectedId)
      ? selectedId
      : filteredPersonas[0]?.id ?? null;

  const selectedPersona = activeSelectedId
    ? filteredPersonas.find((persona) => persona.id === activeSelectedId) ?? null
    : null;

  const formIsValid =
    draft.name.trim().length > 0 &&
    draft.label.trim().length > 0 &&
    draft.ageRange.trim().length > 0 &&
    draft.styleVibe.trim().length > 0 &&
    draft.audienceFit.trim().length > 0 &&
    draft.bestUseCases.length > 0 &&
    draft.contentTone.trim().length > 0 &&
    splitLines(draft.recommendedScenes).length > 0 &&
    splitCommaList(draft.preferredColors).length > 0 &&
    draft.jewelryFit.trim().length > 0 &&
    splitLines(draft.avoidList).length > 0 &&
    draft.promptStarter.trim().length > 0 &&
    splitCommaList(draft.bestContentTypes).length > 0 &&
    splitCommaList(draft.bestMoods).length > 0 &&
    splitCommaList(draft.bestProductCategories).length > 0;

  function updateDraft(field: keyof PersonaDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleUseCase(tag: PersonaUseCaseTag) {
    setDraft((current) => {
      const hasTag = current.bestUseCases.includes(tag);

      if (hasTag) {
        return {
          ...current,
          bestUseCases: current.bestUseCases.filter((item) => item !== tag),
        };
      }

      return {
        ...current,
        bestUseCases: [...current.bestUseCases, tag],
      };
    });
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
      const nextPersona = buildPersonaFromDraft(draft, editingId);
      await updatePersona(nextPersona);
      setSelectedId(nextPersona.id);
      resetForm();
      return;
    }

    if (limitReached) {
      return;
    }

    const nextPersona = buildPersonaFromDraft(draft, createPersonaId(draft.name));
    await createPersona(nextPersona);
    setSelectedId(nextPersona.id);
    resetForm();
  }

  function handleEdit(persona: AiPersonaProfile) {
    setEditingId(persona.id);
    setSelectedId(persona.id);
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
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Not every product should use every persona. Matching the right persona to the right product helps each Reel feel intentional.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Personas help keep visuals, tone, and styling consistent even when you create many campaign ideas quickly.
        </p>
      </div>

      <SectionCard
        title="Quick filters"
        description="Use these tags to focus on the persona style direction you want to plan around right now."
      >
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              useCaseFilter === "all"
                ? "border-accent bg-accent text-white"
                : "border-border/80 bg-white/85 text-foreground hover:border-accent/40 hover:text-accent"
            }`}
            onClick={() => setUseCaseFilter("all")}
            type="button"
          >
            All personas
          </button>
          {useCaseTags.map((tag) => (
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                useCaseFilter === tag.value
                  ? "border-accent bg-accent text-white"
                  : "border-border/80 bg-white/85 text-foreground hover:border-accent/40 hover:text-accent"
              }`}
              key={tag.value}
              onClick={() => setUseCaseFilter(tag.value)}
              type="button"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </SectionCard>

      {filteredPersonas.length === 0 ? (
        <EmptyState
          title="No personas match this filter"
          description="Switch the quick tag filter or reset to sample personas to view your full creative persona set."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            title="Persona cards"
            description="Select a persona to open deeper creative controls and prompt guidance."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPersonas.map((persona, index) => (
                <button
                  className={`rounded-[24px] border p-4 text-left transition ${
                    persona.id === activeSelectedId
                      ? "border-accent bg-accent-soft/35 shadow-[0_16px_36px_rgba(68,52,35,0.08)]"
                      : "border-border/80 bg-white/75 hover:border-accent/40 hover:bg-white"
                  }`}
                  key={persona.id}
                  onClick={() => setSelectedId(persona.id)}
                  type="button"
                >
                  <div className="space-y-3">
                    <PersonaPhotoPlaceholder index={index} name={persona.name} />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">{persona.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{persona.label}</p>
                      </div>
                      <StatusBadge
                        value={persona.status === "active" ? "Active" : "Inactive"}
                      />
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {summarize(persona.styleVibe)}
                    </p>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Top use cases
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {persona.bestUseCases.slice(0, 3).map((tag) => (
                          <span
                            className="rounded-full border border-border/80 bg-white/85 px-2.5 py-1 text-xs font-semibold text-foreground"
                            key={tag}
                          >
                            {toTitleCase(tag)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-border/80 bg-white/75 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Recommended for
                      </p>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        Content: {persona.recommendedFor.bestContentTypes.join(", ")}
                      </p>
                      <p className="text-xs leading-6 text-muted-foreground">
                        Moods: {persona.recommendedFor.bestMoods.join(", ")}
                      </p>
                      <p className="text-xs leading-6 text-muted-foreground">
                        Products: {persona.recommendedFor.bestProductCategories.join(", ")}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Persona detail view"
            description="A focused breakdown to guide creative direction before generating content."
            className="h-fit"
          >
            {selectedPersona ? (
              <div className="space-y-4">
                <div className="rounded-[22px] border border-border/80 bg-accent-soft/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Who this persona represents
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {selectedPersona.name} · {selectedPersona.label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Age range: {selectedPersona.ageRange}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selectedPersona.audienceFit}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Tone: {selectedPersona.contentTone}
                  </p>
                </div>

                <div className="rounded-[22px] border border-border/80 bg-white/75 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    When to use this persona
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedPersona.bestUseCases.map((tag) => (
                      <span
                        className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent"
                        key={tag}
                      >
                        {toTitleCase(tag)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedPersona.recommendedScenes.map((scene) => (
                      <div
                        className="rounded-[16px] border border-border/80 bg-white px-3 py-2 text-sm leading-6 text-foreground"
                        key={scene}
                      >
                        {scene}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-border/80 bg-white/75 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    What products fit best
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selectedPersona.jewelryFit}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Preferred colors: {selectedPersona.preferredColors.join(", ")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Recommended categories:{" "}
                    {selectedPersona.recommendedFor.bestProductCategories.join(", ")}
                  </p>
                </div>

                <div className="rounded-[22px] border border-border/80 bg-danger/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    What to avoid
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-foreground">
                    {selectedPersona.avoidList.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[22px] border border-border/80 bg-white/75 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    AI prompt starter
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {selectedPersona.promptStarter}
                  </p>
                </div>

                <div className="rounded-[22px] border border-dashed border-border bg-accent-soft/25 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Default prompt preview
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">
                    {buildPromptPreview(selectedPersona)}
                  </pre>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-border/70 pt-2">
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                    onClick={() => handleEdit(selectedPersona)}
                    type="button"
                  >
                    Edit persona
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15"
                    onClick={() => {
                      void handleRemove(selectedPersona.id);
                    }}
                    type="button"
                  >
                    Remove persona
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Select a persona"
                description="Choose any persona card to open its full creative guidance, recommended usage, and prompt preview."
              />
            )}
          </SectionCard>
        </div>
      )}

      <SectionCard
        title={editingId ? "Edit persona profile" : "Create persona profile"}
        description="Build up to five persona profiles for future AI-assisted image and video generation. Everything is saved locally for now."
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
              helperText="Use a simple first name so this persona is easy to recognize in dropdowns and planning notes."
            >
              <input
                className={inputClasses}
                onChange={(event) => updateDraft("name", event.target.value)}
                type="text"
                value={draft.name}
              />
            </FieldShell>

            <FieldShell
              label="Label"
              helperText="Give a quick creative label, such as polished everyday or event ready."
            >
              <input
                className={inputClasses}
                onChange={(event) => updateDraft("label", event.target.value)}
                type="text"
                value={draft.label}
              />
            </FieldShell>

            <FieldShell
              label="Age range"
              helperText="Add a simple age range to guide styling references, such as 27-35."
            >
              <input
                className={inputClasses}
                onChange={(event) => updateDraft("ageRange", event.target.value)}
                type="text"
                value={draft.ageRange}
              />
            </FieldShell>

            <FieldShell
              label="Status"
              helperText="Set to active when this persona should be used in current content planning."
            >
              <select
                className={inputClasses}
                onChange={(event) =>
                  updateDraft("status", event.target.value as AiPersonaProfile["status"])
                }
                value={draft.status}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FieldShell>

            <FieldShell
              label="Style vibe"
              helperText="Describe the visual style in plain language so anyone on the team can match it."
            >
              <textarea
                className={inputClasses}
                onChange={(event) => updateDraft("styleVibe", event.target.value)}
                rows={4}
                value={draft.styleVibe}
              />
            </FieldShell>

            <FieldShell
              label="Audience fit"
              helperText="Explain which type of customer this persona is best for."
            >
              <textarea
                className={inputClasses}
                onChange={(event) => updateDraft("audienceFit", event.target.value)}
                rows={4}
                value={draft.audienceFit}
              />
            </FieldShell>

            <FieldShell
              label="Content tone"
              helperText="Describe how captions and scripts should feel when this persona is used."
            >
              <textarea
                className={inputClasses}
                onChange={(event) => updateDraft("contentTone", event.target.value)}
                rows={4}
                value={draft.contentTone}
              />
            </FieldShell>

            <FieldShell
              label="Preferred colors"
              helperText="List color directions separated by commas, like soft gold, cream, muted sage."
            >
              <textarea
                className={inputClasses}
                onChange={(event) => updateDraft("preferredColors", event.target.value)}
                rows={4}
                value={draft.preferredColors}
              />
            </FieldShell>

            <FieldShell
              label="Recommended scenes"
              helperText="Add scene ideas on separate lines so future AI generation has clear visual guidance."
            >
              <textarea
                className={inputClasses}
                onChange={(event) => updateDraft("recommendedScenes", event.target.value)}
                rows={6}
                value={draft.recommendedScenes}
              />
            </FieldShell>

            <FieldShell
              label="Jewelry fit"
              helperText="Describe which jewelry styles and product moments fit this persona best."
            >
              <textarea
                className={inputClasses}
                onChange={(event) => updateDraft("jewelryFit", event.target.value)}
                rows={6}
                value={draft.jewelryFit}
              />
            </FieldShell>

            <FieldShell
              label="Avoid list"
              helperText="List what should be avoided for this persona, one item per line."
            >
              <textarea
                className={inputClasses}
                onChange={(event) => updateDraft("avoidList", event.target.value)}
                rows={6}
                value={draft.avoidList}
              />
            </FieldShell>

            <FieldShell
              label="AI prompt starter"
              helperText="Write one starter sentence that can be reused later when AI generation is connected."
            >
              <textarea
                className={inputClasses}
                onChange={(event) => updateDraft("promptStarter", event.target.value)}
                rows={6}
                value={draft.promptStarter}
              />
            </FieldShell>
          </div>

          <div className="rounded-[24px] border border-border/80 bg-accent-soft/30 p-4">
            <p className="text-sm font-semibold text-foreground">Best use cases</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Pick one or more quick tags. This helps with filtering and keeps persona selection intentional.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {useCaseTags.map((tag) => {
                const active = draft.bestUseCases.includes(tag.value);

                return (
                  <button
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-accent bg-accent text-white"
                        : "border-border/80 bg-white/85 text-foreground hover:border-accent/40 hover:text-accent"
                    }`}
                    key={tag.value}
                    onClick={() => toggleUseCase(tag.value)}
                    type="button"
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <SectionCard
            className="border-border/70 bg-white/55 p-4 shadow-none"
            description="This block tells the team where this persona performs best."
            title="Recommended for"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <FieldShell
                label="Best content types"
                helperText="Comma-separated, such as lifestyle, story, luxury."
              >
                <textarea
                  className={inputClasses}
                  onChange={(event) => updateDraft("bestContentTypes", event.target.value)}
                  rows={3}
                  value={draft.bestContentTypes}
                />
              </FieldShell>
              <FieldShell
                label="Best moods"
                helperText="Comma-separated, such as elevated, warm, minimal."
              >
                <textarea
                  className={inputClasses}
                  onChange={(event) => updateDraft("bestMoods", event.target.value)}
                  rows={3}
                  value={draft.bestMoods}
                />
              </FieldShell>
              <FieldShell
                label="Best product categories"
                helperText="Comma-separated, such as earrings, necklaces, rings."
              >
                <textarea
                  className={inputClasses}
                  onChange={(event) =>
                    updateDraft("bestProductCategories", event.target.value)
                  }
                  rows={3}
                  value={draft.bestProductCategories}
                />
              </FieldShell>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-3 rounded-[24px] border border-border/80 bg-white/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {personaCount} of {MAX_PERSONAS} personas saved
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This version uses local mock storage only, so you can safely test persona strategy without touching a live system.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                onClick={() => {
                  void resetPersonas();
                  setSelectedId(null);
                  resetForm();
                }}
                type="button"
              >
                Reset starter personas
              </button>
              {editingId ? (
                <button
                  className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel edit
                </button>
              ) : null}
              <button
                className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!formIsValid || (!editingId && limitReached)}
                type="submit"
              >
                {editingId ? "Update persona" : "Save persona"}
              </button>
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
