"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useStudioContent,
  useStudioPersonas,
  useStudioProducts,
} from "@/lib/studio-data-provider";
import type {
  ContentIdeaType,
  ContentMood,
  ContentPlatform,
  VideoAssetStatus,
} from "@/types/studio";

interface FieldShellProps {
  label: string;
  helperText: string;
  children: React.ReactNode;
}

const inputClasses =
  "mt-2 w-full rounded-2xl border border-border/80 bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function FieldShell({ label, helperText, children }: FieldShellProps) {
  return (
    <div className="block">
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
        {helperText}
      </span>
      {children}
    </div>
  );
}

export function ContentIdeasPanel() {
  const { personas } = useStudioPersonas();
  const { products } = useStudioProducts();
  const {
    contentIdeas,
    generateIdeas,
    saveContentIdea,
    generateVisualPlanForIdea,
    markContentIdeaReadyForReview,
    archiveContentIdea,
    regenerateContentIdea,
    generationOptions,
  } = useStudioContent();
  const [requestedPersonaId, setRequestedPersonaId] = useState("");
  const [requestedProductId, setRequestedProductId] = useState("");
  const [platform, setPlatform] = useState<ContentPlatform>("Instagram Reels");
  const [mood, setMood] = useState<ContentMood>("Elevated");
  const [contentType, setContentType] = useState<ContentIdeaType>("lifestyle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [activeIdeaAction, setActiveIdeaAction] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [recentIdeaIds, setRecentIdeaIds] = useState<string[]>([]);
  const [expandedVisualPlanIdeaIds, setExpandedVisualPlanIdeaIds] = useState<string[]>([]);

  const platformOptions = generationOptions.platforms;
  const moodOptions = generationOptions.moods;
  const typeOptions = generationOptions.contentTypes;

  const defaultPersonaId =
    personas.find((persona) => persona.status === "active")?.id ?? personas[0]?.id ?? "";
  const defaultProductId = products[0]?.id ?? "";

  useEffect(() => {
    if (!requestedPersonaId && defaultPersonaId) {
      setRequestedPersonaId(defaultPersonaId);
    }
  }, [defaultPersonaId, requestedPersonaId]);

  useEffect(() => {
    if (!requestedProductId && defaultProductId) {
      setRequestedProductId(defaultProductId);
    }
  }, [defaultProductId, requestedProductId]);

  useEffect(() => {
    if (!platformOptions.includes(platform) && platformOptions[0]) {
      setPlatform(platformOptions[0]);
    }
  }, [platform, platformOptions]);

  useEffect(() => {
    if (!moodOptions.includes(mood) && moodOptions[0]) {
      setMood(moodOptions[0]);
    }
  }, [mood, moodOptions]);

  useEffect(() => {
    if (!typeOptions.includes(contentType) && typeOptions[0]) {
      setContentType(typeOptions[0]);
    }
  }, [contentType, typeOptions]);

  const selectedPersonaId = personas.some((persona) => persona.id === requestedPersonaId)
    ? requestedPersonaId
    : defaultPersonaId;
  const selectedProductId = products.some((product) => product.id === requestedProductId)
    ? requestedProductId
    : defaultProductId;

  const selectedPersona = personas.find((persona) => persona.id === selectedPersonaId);
  const selectedProduct = products.find((product) => product.id === selectedProductId);

  const canGenerate = Boolean(selectedPersona && selectedProduct) && !isGenerating;
  const ideas = [...contentIdeas]
    .filter((idea) => idea.status !== "Archived")
    .sort((left, right) => {
    const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
    const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;

    if (leftTime === rightTime) {
      return right.id.localeCompare(left.id);
    }

    return rightTime - leftTime;
    });

  async function handleGenerateIdeas() {
    if (!selectedPersona || !selectedProduct) {
      return;
    }

    setError("");
    setNotice("");
    setIsGenerating(true);

    try {
      const result = await generateIdeas({
        persona: selectedPersona,
        product: selectedProduct,
        platform,
        mood,
        contentType,
      });

      setRecentIdeaIds(result.ideas.map((idea) => idea.id));
      setNotice(
        result.source === "openai"
          ? `${result.ideas.length} ideas generated and auto-saved.`
          : `${result.ideas.length} fallback ideas generated and auto-saved. OpenAI was unavailable this time.`,
      );
    } catch {
      setError("We could not generate ideas right now. Please try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleIdeaAction(
    ideaId: string,
    action: "save" | "review" | "archive" | "regenerate" | "visual-plan",
  ) {
    setError("");
    setNotice("");
    setActiveIdeaId(ideaId);
    setActiveIdeaAction(action);

    try {
      if (action === "save") {
        await saveContentIdea(ideaId);
        setNotice("Idea marked as saved.");
      }

      if (action === "review") {
        await markContentIdeaReadyForReview(ideaId);
        setNotice("Idea marked as ready for review.");
      }

      if (action === "archive") {
        await archiveContentIdea(ideaId);
        setNotice("Idea archived.");
      }

      if (action === "regenerate") {
        const result = await regenerateContentIdea(ideaId);
        if (result) {
          setRecentIdeaIds(result.ideas.map((idea) => idea.id));
          setNotice(
            result.source === "openai"
              ? "Idea regenerated with OpenAI and auto-saved."
              : "Idea regenerated with fallback content and auto-saved.",
          );
        } else {
          setError("We could not regenerate this idea.");
        }
      }

      if (action === "visual-plan") {
        const updated = await generateVisualPlanForIdea(ideaId);
        if (updated?.visualPlan) {
          setExpandedVisualPlanIdeaIds((current) =>
            current.includes(ideaId) ? current : [...current, ideaId],
          );
          setNotice("Visual plan generated. Review the production details below.");
        } else {
          setError("We could not generate a visual plan for this idea.");
        }
      }
    } catch {
      setError("We could not complete that action. Please try again.");
    } finally {
      setActiveIdeaId(null);
      setActiveIdeaAction("");
    }
  }

  function toggleVisualPlan(ideaId: string) {
    setExpandedVisualPlanIdeaIds((current) =>
      current.includes(ideaId)
        ? current.filter((entry) => entry !== ideaId)
        : [...current, ideaId],
    );
  }

  function formatVideoStatus(status: VideoAssetStatus) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  if (personas.length === 0 || products.length === 0) {
    return (
      <EmptyState
        title="Create personas and products first"
        description="The Content Ideas generator needs at least one persona and one product in the library before it can generate ideas."
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Idea generator"
        description="Choose the persona, product, and creative direction you want, then generate AI-assisted content ideas that are automatically saved."
      >
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-5 md:grid-cols-2">
            <FieldShell
              label="Persona"
              helperText="Pick the fictional model profile you want this content angle to follow."
            >
              <select
                className={inputClasses}
                value={selectedPersonaId}
                onChange={(event) => setRequestedPersonaId(event.target.value)}
              >
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} ({persona.status === "active" ? "Active" : "Inactive"})
                  </option>
                ))}
              </select>
            </FieldShell>

            <FieldShell
              label="Product"
              helperText="Choose the jewelry product the content should focus on."
            >
              <select
                className={inputClasses}
                value={selectedProductId}
                onChange={(event) => setRequestedProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.productName}
                  </option>
                ))}
              </select>
            </FieldShell>

            <FieldShell
              label="Platform"
              helperText="The generation flow is built to support more channels later. For now, it defaults to Instagram Reels."
            >
              <select
                className={inputClasses}
                value={platform}
                onChange={(event) =>
                  setPlatform(event.target.value as ContentPlatform)
                }
              >
                {platformOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldShell>

            <FieldShell
              label="Mood"
              helperText="Pick the emotional feel you want the content to give off."
            >
              <select
                className={inputClasses}
                value={mood}
                onChange={(event) => setMood(event.target.value as ContentMood)}
              >
                {moodOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldShell>

            <FieldShell
              label="Content type"
              helperText="Choose the content angle the AI should lean toward when creating concepts."
            >
              <select
                className={inputClasses}
                value={contentType}
                onChange={(event) =>
                  setContentType(event.target.value as ContentIdeaType)
                }
              >
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>

          <div className="space-y-4 rounded-[28px] border border-border/80 bg-accent-soft/35 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Current selection
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {selectedPersona?.name} with {selectedProduct?.productName}
              </p>
            </div>

            <div className="rounded-[22px] border border-border/80 bg-white/75 p-4">
              <p className="text-sm font-semibold text-foreground">Persona style vibe</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {selectedPersona?.styleVibe}
              </p>
            </div>

            <div className="rounded-[22px] border border-border/80 bg-white/75 p-4">
              <p className="text-sm font-semibold text-foreground">Product notes</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {selectedProduct?.productNotes}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedProduct?.styleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/80 bg-white/80 px-3 py-1 text-xs font-semibold text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <button
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canGenerate}
              onClick={() => void handleGenerateIdeas()}
              type="button"
            >
              {isGenerating ? "Generating..." : "Generate Ideas"}
            </button>
          </div>
        </div>
      </SectionCard>

      {notice ? (
        <div className="rounded-[20px] border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      {ideas.length === 0 ? (
        <EmptyState
          title="No ideas generated yet"
          description="Choose your inputs above and click Generate Ideas to create and auto-save new content cards."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-[20px] border border-border/80 bg-white/75 px-4 py-3 text-sm text-muted-foreground">
            Ideas are auto-saved when generated. Use <span className="font-semibold text-foreground">Save</span> to mark keepers, <span className="font-semibold text-foreground">Send to Review</span> to mark review-ready ideas, and <span className="font-semibold text-foreground">Archive</span> to hide older options.
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {ideas.map((idea) => (
              <SectionCard
                key={idea.id}
                title={idea.title}
                description={`${idea.contentType ?? contentType} · ${idea.mood ?? mood} · ${idea.platform ?? platform}`}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={idea.status} />
                    <StatusBadge value={idea.priority} />
                    {recentIdeaIds.includes(idea.id) ? (
                      <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                        Just generated
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Hook
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {idea.hook}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Concept summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {idea.concept}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Visual direction
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {idea.visualDirection ?? "No visual direction saved yet."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Caption idea
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {idea.captionAngle}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-border/80 bg-accent-soft/35 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      CTA
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {idea.cta ?? "No CTA saved yet."}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-border/80 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Video asset
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        value={formatVideoStatus(idea.videoAssets?.[0]?.status ?? "draft")}
                      />
                      <span className="text-sm text-muted-foreground">
                        {idea.videoAssets?.[0]?.videoUrl
                          ? "Video file attached."
                          : "Video not generated yet."}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {idea.videoAssets?.[0]?.generationNotes ??
                        "Generate a visual plan first, then connect a video provider in a future phase."}
                    </p>
                  </div>

                  {idea.visualPlan && expandedVisualPlanIdeaIds.includes(idea.id) ? (
                    <div className="space-y-3 rounded-[22px] border border-border/80 bg-white/90 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Visual plan
                      </p>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Scene description
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {idea.visualPlan.sceneDescription}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Lighting
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {idea.visualPlan.lighting}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Camera angle
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {idea.visualPlan.cameraAngle}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Motion
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {idea.visualPlan.motion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Styling notes
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {idea.visualPlan.stylingNotes}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Product focus
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {idea.visualPlan.productFocus}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Scene mood
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {idea.visualPlan.sceneMood}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Background
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {idea.visualPlan.background}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Avoid
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {idea.visualPlan.avoid}
                        </p>
                      </div>
                      {idea.visualPlan.shotSequence.length > 0 ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Shot sequence
                          </p>
                          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                            {idea.visualPlan.shotSequence.map((step, index) => (
                              <li key={`${idea.id}-shot-step-${index + 1}`}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={activeIdeaId === idea.id}
                      onClick={() => void handleIdeaAction(idea.id, "regenerate")}
                      type="button"
                    >
                      {activeIdeaId === idea.id && activeIdeaAction === "regenerate"
                        ? "Regenerating..."
                        : "Regenerate"}
                    </button>

                    <button
                      className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={activeIdeaId === idea.id || idea.status === "Saved"}
                      onClick={() => void handleIdeaAction(idea.id, "save")}
                      type="button"
                    >
                      {idea.status === "Saved"
                        ? "Saved"
                        : activeIdeaId === idea.id && activeIdeaAction === "save"
                          ? "Saving..."
                          : "Save"}
                    </button>

                    <button
                      className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={activeIdeaId === idea.id || idea.status === "Archived"}
                      onClick={() => void handleIdeaAction(idea.id, "visual-plan")}
                      type="button"
                    >
                      {activeIdeaId === idea.id && activeIdeaAction === "visual-plan"
                        ? "Building plan..."
                        : idea.visualPlan
                          ? "Regenerate Visual Plan"
                          : "Generate Visual Plan"}
                    </button>

                    {idea.visualPlan ? (
                      <button
                        className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white"
                        onClick={() => toggleVisualPlan(idea.id)}
                        type="button"
                      >
                        {expandedVisualPlanIdeaIds.includes(idea.id)
                          ? "Hide Visual Plan"
                          : "Show Visual Plan"}
                      </button>
                    ) : (
                      <div className="hidden sm:block" />
                    )}

                    <button
                      className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={
                        activeIdeaId === idea.id ||
                        idea.status === "Ready for Review" ||
                        idea.status === "Archived"
                      }
                      onClick={() => void handleIdeaAction(idea.id, "review")}
                      type="button"
                    >
                      {idea.status === "Ready for Review"
                        ? "In Review Queue"
                        : activeIdeaId === idea.id && activeIdeaAction === "review"
                          ? "Sending..."
                          : "Send to Review"}
                    </button>

                    <button
                      className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={activeIdeaId === idea.id || idea.status === "Archived"}
                      onClick={() => void handleIdeaAction(idea.id, "archive")}
                      type="button"
                    >
                      {idea.status === "Archived"
                        ? "Archived"
                        : activeIdeaId === idea.id && activeIdeaAction === "archive"
                          ? "Archiving..."
                          : "Archive"}
                    </button>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
