"use client";

import { useState } from "react";
import { SectionCard } from "@/components/ui/section-card";
import type { BrandProfile } from "@/types/studio";

interface BrandProfilePanelProps {
  initialProfile: BrandProfile;
}

const inputClasses =
  "w-full rounded-2xl border border-border/80 bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

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

export function BrandProfilePanel({ initialProfile }: BrandProfilePanelProps) {
  // Local state keeps the screen editable-looking without requiring a database in v1.
  const [form, setForm] = useState({
    brandName: initialProfile.brandName,
    focus: initialProfile.focus,
    audience: initialProfile.audience,
    voiceSummary: initialProfile.voiceSummary,
    postingCadence: initialProfile.postingCadence,
    productionNotes: initialProfile.productionNotes,
    toneKeywords: initialProfile.toneKeywords.join(", "),
    visualDirection: initialProfile.visualDirection.join("\n"),
    reelGoals: initialProfile.reelGoals.join("\n"),
    approvedCtas: initialProfile.approvedCtas.join("\n"),
    forbiddenPhrases: initialProfile.forbiddenPhrases.join("\n"),
    contentGuardrails: initialProfile.contentGuardrails.join("\n"),
    preferredHooks: initialProfile.preferredHooks.join("\n"),
  });

  const preview = {
    toneKeywords: splitCommaList(form.toneKeywords),
    visualDirection: splitLines(form.visualDirection),
    reelGoals: splitLines(form.reelGoals),
    approvedCtas: splitLines(form.approvedCtas),
    forbiddenPhrases: splitLines(form.forbiddenPhrases),
    contentGuardrails: splitLines(form.contentGuardrails),
    preferredHooks: splitLines(form.preferredHooks),
  };

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-border/80 bg-accent-soft/45 px-5 py-4">
        <p className="text-sm font-semibold text-foreground">Editable preview only</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          The fields below behave like a working admin form, but nothing is saved or published in this first version.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <SectionCard
            title="Core brand profile"
            description="Use this area to keep the team aligned on voice, audience, and the role Reels should play."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-1">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Brand name
                </span>
                <input
                  className={inputClasses}
                  type="text"
                  value={form.brandName}
                  onChange={(event) => updateField("brandName", event.target.value)}
                />
              </label>
              <label className="block md:col-span-1">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Posting cadence
                </span>
                <input
                  className={inputClasses}
                  type="text"
                  value={form.postingCadence}
                  onChange={(event) => updateField("postingCadence", event.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Brand focus
                </span>
                <textarea
                  className={inputClasses}
                  rows={3}
                  value={form.focus}
                  onChange={(event) => updateField("focus", event.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Audience
                </span>
                <textarea
                  className={inputClasses}
                  rows={3}
                  value={form.audience}
                  onChange={(event) => updateField("audience", event.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Voice summary
                </span>
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={form.voiceSummary}
                  onChange={(event) => updateField("voiceSummary", event.target.value)}
                />
              </label>
            </div>
          </SectionCard>

          <SectionCard
            title="Creative direction"
            description="These notes guide how AI-generated campaign ideas should feel before they ever get reviewed by a person."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Tone keywords
                </span>
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={form.toneKeywords}
                  onChange={(event) => updateField("toneKeywords", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Preferred hooks
                </span>
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={form.preferredHooks}
                  onChange={(event) => updateField("preferredHooks", event.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Visual direction
                </span>
                <textarea
                  className={inputClasses}
                  rows={5}
                  value={form.visualDirection}
                  onChange={(event) => updateField("visualDirection", event.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Reel goals
                </span>
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={form.reelGoals}
                  onChange={(event) => updateField("reelGoals", event.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Production notes
                </span>
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={form.productionNotes}
                  onChange={(event) => updateField("productionNotes", event.target.value)}
                />
              </label>
            </div>
          </SectionCard>

          <SectionCard
            title="Approval guardrails"
            description="Helpful for future owners: one list shows what the team should say, the other shows what to avoid."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Approved CTAs
                </span>
                <textarea
                  className={inputClasses}
                  rows={5}
                  value={form.approvedCtas}
                  onChange={(event) => updateField("approvedCtas", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Forbidden phrases
                </span>
                <textarea
                  className={inputClasses}
                  rows={5}
                  value={form.forbiddenPhrases}
                  onChange={(event) => updateField("forbiddenPhrases", event.target.value)}
                />
              </label>
              <label className="block lg:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Content guardrails
                </span>
                <textarea
                  className={inputClasses}
                  rows={5}
                  value={form.contentGuardrails}
                  onChange={(event) => updateField("contentGuardrails", event.target.value)}
                />
              </label>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Live preview"
          description="A compact readout of how the current brand settings would guide the rest of the studio."
          className="h-fit"
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Brand
              </p>
              <p className="mt-2 font-serif text-3xl font-semibold text-foreground">
                {form.brandName}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.focus}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Tone keywords
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {preview.toneKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Creative checklist
              </p>
              {preview.visualDirection.slice(0, 3).map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/80 bg-white/75 px-4 py-3 text-sm text-foreground"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Approved calls to action
              </p>
              {preview.approvedCtas.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/80 bg-white/75 px-4 py-3 text-sm text-foreground"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-border/80 bg-accent-soft/40 p-4">
              <p className="text-sm font-semibold text-foreground">Current operating note</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {form.productionNotes}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
