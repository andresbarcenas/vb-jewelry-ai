"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { useStudioBrand } from "@/lib/studio-data-provider";
import type { BrandProfile } from "@/types/studio";

interface FieldShellProps {
  label: string;
  helperText: string;
  children: React.ReactNode;
}

const inputClasses =
  "mt-2 w-full rounded-2xl border border-border/80 bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function formatHandle(handle: string) {
  if (!handle.trim()) {
    return "@yourbrand";
  }

  return handle.startsWith("@") ? handle : `@${handle}`;
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

function buildBrandBrief(profile: BrandProfile) {
  const brandName = profile.brandName || "This brand";
  const handle = formatHandle(profile.instagramHandle);
  const styleKeywords = joinList(profile.styleKeywords);
  const colors = joinList(profile.preferredColors);
  const categories = joinList(profile.productCategories);
  const avoidTerms = joinList(profile.doNotUseList);

  return `${brandName} appears on Instagram as ${handle}. It should sound ${profile.brandVoice} The target customer is ${profile.targetCustomer} The overall look should feel ${styleKeywords}. Feature colors like ${colors}, prioritize categories such as ${categories}, and avoid wording or angles like ${avoidTerms}.`;
}

export function BrandProfilePanel() {
  const { brandProfile, resetBrandProfile, saveBrandProfile } = useStudioBrand();
  const [form, setForm] = useState<BrandProfile>(brandProfile);

  useEffect(() => {
    setForm(brandProfile);
  }, [brandProfile]);

  const brandBrief = buildBrandBrief(form);

  function updateTextField(field: keyof Pick<
    BrandProfile,
    "brandName" | "brandVoice" | "targetCustomer" | "instagramHandle"
  >,
  value: string) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };
      void saveBrandProfile(next);
      return next;
    });
  }

  function updateListField(
    field: keyof Pick<
      BrandProfile,
      "styleKeywords" | "preferredColors" | "productCategories"
  >,
  value: string,
  ) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: splitCommaList(value),
      };
      void saveBrandProfile(next);
      return next;
    });
  }

  function updateDoNotUseList(value: string) {
    setForm((current) => {
      const next = {
        ...current,
        doNotUseList: splitLines(value),
      };
      void saveBrandProfile(next);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[28px] border border-border/80 bg-accent-soft/45 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Saved locally in this browser
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            This section uses a simple mock store for now, so your edits stay local and do not affect a live database.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
          onClick={() => {
            void resetBrandProfile();
          }}
          type="button"
        >
          Reset to sample data
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Brand settings"
          description="Fill this out in plain business language. The rest of the studio can use it later to keep content ideas on brand."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FieldShell
              label="Brand name"
              helperText="Use the public name you want the team and future AI prompts to refer to."
            >
              <input
                className={inputClasses}
                type="text"
                value={form.brandName}
                onChange={(event) => updateTextField("brandName", event.target.value)}
              />
            </FieldShell>

            <FieldShell
              label="Instagram handle"
              helperText="Enter the account handle customers would recognize. You can type it with or without the @ symbol."
            >
              <input
                className={inputClasses}
                type="text"
                value={form.instagramHandle}
                onChange={(event) =>
                  updateTextField("instagramHandle", event.target.value)
                }
              />
            </FieldShell>

            <FieldShell
              label="Brand voice"
              helperText="Describe how the brand should sound when it writes captions, briefs, or content ideas."
            >
              <textarea
                className={inputClasses}
                rows={4}
                value={form.brandVoice}
                onChange={(event) => updateTextField("brandVoice", event.target.value)}
              />
            </FieldShell>

            <FieldShell
              label="Target customer"
              helperText="Explain who you are trying to reach in simple terms, including what they care about or how they shop."
            >
              <textarea
                className={inputClasses}
                rows={4}
                value={form.targetCustomer}
                onChange={(event) =>
                  updateTextField("targetCustomer", event.target.value)
                }
              />
            </FieldShell>

            <FieldShell
              label="Style keywords"
              helperText="Add a few short words or phrases that describe the brand look. Separate each one with a comma."
            >
              <textarea
                className={inputClasses}
                rows={4}
                value={form.styleKeywords.join(", ")}
                onChange={(event) => updateListField("styleKeywords", event.target.value)}
              />
            </FieldShell>

            <FieldShell
              label="Preferred colors"
              helperText="List the colors that should show up most often in creative direction, references, or moodboards. Separate each one with a comma."
            >
              <textarea
                className={inputClasses}
                rows={4}
                value={form.preferredColors.join(", ")}
                onChange={(event) =>
                  updateListField("preferredColors", event.target.value)
                }
              />
            </FieldShell>

            <FieldShell
              label="Do not use list"
              helperText="Write the words, phrases, or content angles the brand should avoid. Put each one on its own line."
            >
              <textarea
                className={inputClasses}
                rows={6}
                value={form.doNotUseList.join("\n")}
                onChange={(event) => updateDoNotUseList(event.target.value)}
              />
            </FieldShell>

            <FieldShell
              label="Product categories"
              helperText="List the product groups the business wants the studio to talk about most. Separate each one with a comma."
            >
              <textarea
                className={inputClasses}
                rows={6}
                value={form.productCategories.join(", ")}
                onChange={(event) =>
                  updateListField("productCategories", event.target.value)
                }
              />
            </FieldShell>
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            title="Brand brief"
            description="This summary turns the form into a simple brief the team can use as a quick reference."
            className="h-fit"
          >
            <div className="space-y-5">
              <div className="rounded-[24px] border border-border/80 bg-accent-soft/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  One-paragraph brief
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground">{brandBrief}</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Quick reference
                </p>
                <div className="rounded-[22px] border border-border/80 bg-white/75 p-4">
                  <p className="text-sm font-semibold text-foreground">Customer</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {form.targetCustomer}
                  </p>
                </div>
                <div className="rounded-[22px] border border-border/80 bg-white/75 p-4">
                  <p className="text-sm font-semibold text-foreground">Instagram</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {formatHandle(form.instagramHandle)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Style keywords
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.styleKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-border/80 bg-white/75 p-4">
                  <p className="text-sm font-semibold text-foreground">Preferred colors</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {joinList(form.preferredColors)}
                  </p>
                </div>
                <div className="rounded-[22px] border border-border/80 bg-white/75 p-4">
                  <p className="text-sm font-semibold text-foreground">Product categories</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {joinList(form.productCategories)}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-border/80 bg-white/75 p-4">
                <p className="text-sm font-semibold text-foreground">Do not use</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.doNotUseList.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-danger/20 bg-danger/10 px-3 py-1 text-xs font-semibold text-danger"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
