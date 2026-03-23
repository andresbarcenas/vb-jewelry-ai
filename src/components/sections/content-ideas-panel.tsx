"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getJobStatus } from "@/lib/services/ai-job.service";
import {
  useStudioContent,
  useStudioPersonas,
  useStudioProducts,
} from "@/lib/studio-data-provider";
import type {
  ContentIdeaType,
  ContentMood,
  ContentPlatform,
  ProductImageFailureReason,
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
    generateProductImagesForIdea,
    saveContentIdea,
    generateVisualPlanForIdea,
    markContentIdeaReadyForReview,
    archiveContentIdea,
    regenerateContentIdea,
    updateProductImageAsset,
    generationOptions,
    refreshStudioData,
  } = useStudioContent();
  const [requestedPersonaId, setRequestedPersonaId] = useState("");
  const [requestedProductId, setRequestedProductId] = useState("");
  const [platform, setPlatform] = useState<ContentPlatform>("Instagram Reels");
  const [mood, setMood] = useState<ContentMood>("Elevated");
  const [contentType, setContentType] = useState<ContentIdeaType>("lifestyle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeGenerationJobId, setActiveGenerationJobId] = useState<string | null>(null);
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [activeIdeaAction, setActiveIdeaAction] = useState("");
  const [activeProductImageJobId, setActiveProductImageJobId] = useState<string | null>(null);
  const [activeProductImageIdeaId, setActiveProductImageIdeaId] = useState<string | null>(null);
  const [activeProductImageAssetId, setActiveProductImageAssetId] = useState<string | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [recentIdeaIds, setRecentIdeaIds] = useState<string[]>([]);
  const [expandedVisualPlanIdeaIds, setExpandedVisualPlanIdeaIds] = useState<string[]>([]);
  const [productImageFeedbackByIdea, setProductImageFeedbackByIdea] = useState<
    Record<string, string>
  >({});

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

  const canGenerate =
    Boolean(selectedPersona && selectedProduct) && !isGenerating && !activeGenerationJobId;
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

      if (!result?.jobId) {
        setError("Generation could not be queued right now. Please try again.");
        return;
      }

      setActiveGenerationJobId(result.jobId);
      setNotice("Your image or video content is being prepared and will be available soon.");
    } catch {
      setError("We could not generate ideas right now. Please try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  }

  const refreshGenerationJobStatus = useCallback(async (jobId: string) => {
    const status = await getJobStatus(jobId);

    if (!status) {
      setError("We could not check generation status right now. Please try again.");
      return;
    }

    if (status.status === "completed") {
      await refreshStudioData();

      const ideaIds =
        Array.isArray(status.metadata?.ideaIds) &&
        status.metadata.ideaIds.every((value) => typeof value === "string")
          ? (status.metadata.ideaIds as string[])
          : [];
      if (ideaIds.length > 0) {
        setRecentIdeaIds(ideaIds);
      }

      setActiveGenerationJobId(null);
      setNotice(status.message || "Ideas are ready.");
      return;
    }

    if (status.status === "failed") {
      setActiveGenerationJobId(null);
      setError(status.error || status.message || "Generation failed. Please try again.");
      return;
    }

    setNotice("Your image or video content is being prepared and will be available soon.");
  }, [refreshStudioData]);

  useEffect(() => {
    if (!activeGenerationJobId) {
      return;
    }

    void refreshGenerationJobStatus(activeGenerationJobId);

    const interval = window.setInterval(() => {
      void refreshGenerationJobStatus(activeGenerationJobId);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeGenerationJobId, refreshGenerationJobStatus]);

  async function handleIdeaAction(
    ideaId: string,
    action:
      | "save"
      | "review"
      | "archive"
      | "regenerate"
      | "visual-plan"
      | "product-images",
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
        if (result?.jobId) {
          setActiveGenerationJobId(result.jobId);
          setNotice("Your image or video content is being prepared and will be available soon.");
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

      if (action === "product-images") {
        setProductImageFeedbackByIdea((current) => {
          const next = { ...current };
          delete next[ideaId];
          return next;
        });

        const queued = await generateProductImagesForIdea(ideaId, 3);

        if (queued.error) {
          setError(queued.error);
          setProductImageFeedbackByIdea((current) => ({
            ...current,
            [ideaId]: queued.error ?? "Product image generation could not be queued.",
          }));
        } else if (queued.job?.jobId) {
          setActiveProductImageJobId(queued.job.jobId);
          setActiveProductImageIdeaId(ideaId);
          setNotice("Product images are being prepared and will be available soon.");
        } else {
          setError("We could not queue product image generation right now.");
          setProductImageFeedbackByIdea((current) => ({
            ...current,
            [ideaId]: "We could not queue product image generation right now.",
          }));
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

  const refreshProductImageJobStatus = useCallback(
    async (jobId: string, ideaId: string | null) => {
    const status = await getJobStatus(jobId);

    if (!status) {
      setError("We could not check product image status right now. Please try again.");
      return;
    }

    if (status.status === "completed") {
      await refreshStudioData();
      setActiveProductImageJobId(null);
      setActiveProductImageIdeaId(null);
      if (ideaId) {
        setProductImageFeedbackByIdea((current) => {
          const next = { ...current };
          delete next[ideaId];
          return next;
        });
      }
      setNotice(status.message || "Product images are ready.");
      return;
    }

    if (status.status === "failed") {
      setActiveProductImageJobId(null);
      setActiveProductImageIdeaId(null);
      const reasonCode = (() => {
        const raw = status.metadata?.reasonCode;
        if (
          raw === "persona_reference_missing" ||
          raw === "product_reference_missing" ||
          raw === "product_mismatch_or_low_visibility"
        ) {
          return raw as ProductImageFailureReason;
        }

        return null;
      })();

      let failureMessage =
        status.error || status.message || "Product image generation failed.";

      if (reasonCode === "product_mismatch_or_low_visibility") {
        failureMessage =
          "We couldn’t confirm product accuracy on this run. Product accuracy mode is on, so this image was not saved. Please click Regenerate to try again.";
      } else if (reasonCode === "product_reference_missing") {
        failureMessage =
          "Please upload a clear product photo in Product Library before generating product images.";
      } else if (reasonCode === "persona_reference_missing") {
        failureMessage =
          "Please set a primary persona reference image before generating product images.";
      }

      if (ideaId) {
        setProductImageFeedbackByIdea((current) => ({
          ...current,
          [ideaId]: failureMessage,
        }));
      }

      setError(failureMessage);
      return;
    }

    setNotice("Product images are being prepared and will be available soon.");
    },
    [refreshStudioData],
  );

  useEffect(() => {
    if (!activeProductImageJobId) {
      return;
    }

    void refreshProductImageJobStatus(activeProductImageJobId, activeProductImageIdeaId);

    const interval = window.setInterval(() => {
      void refreshProductImageJobStatus(activeProductImageJobId, activeProductImageIdeaId);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeProductImageIdeaId, activeProductImageJobId, refreshProductImageJobStatus]);

  async function handleProductImageAssetAction(
    ideaId: string,
    assetId: string,
    action: "approve" | "discard" | "regenerate",
  ) {
    setError("");
    setNotice("");
    setActiveProductImageAssetId(assetId);

    try {
      const result = await updateProductImageAsset(ideaId, assetId, action);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.job?.jobId) {
        setProductImageFeedbackByIdea((current) => {
          const next = { ...current };
          delete next[ideaId];
          return next;
        });
        setActiveProductImageJobId(result.job.jobId);
        setActiveProductImageIdeaId(ideaId);
        setNotice("Product image regeneration is in progress and will be available soon.");
        return;
      }

      setNotice(
        action === "approve"
          ? "Product image approved."
          : "Product image discarded.",
      );
    } catch {
      setError("We could not update that product image right now.");
    } finally {
      setActiveProductImageAssetId(null);
    }
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canGenerate}
                onClick={() => void handleGenerateIdeas()}
                type="button"
              >
                {isGenerating
                  ? "Queuing..."
                  : activeGenerationJobId
                    ? "Preparing Ideas..."
                    : "Generate Ideas"}
              </button>
              {activeGenerationJobId ? (
                <button
                  className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                  onClick={() => void refreshGenerationJobStatus(activeGenerationJobId)}
                  type="button"
                >
                  Refresh status
                </button>
              ) : null}
            </div>
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

                  <div className="rounded-[22px] border border-border/80 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Product images
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Generate product-on-person stills using the visual plan and the persona&apos;s primary reference image.
                    </p>
                    <p className="mt-2 inline-flex items-center rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                      Product accuracy mode enabled
                    </p>
                    {productImageFeedbackByIdea[idea.id] ? (
                      <div className="mt-3 rounded-xl border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning">
                        {productImageFeedbackByIdea[idea.id]}
                      </div>
                    ) : null}
                    {!idea.visualPlan ? (
                      <p className="mt-2 text-sm text-warning">
                        Generate a visual plan first before creating product images.
                      </p>
                    ) : null}
                    {(() => {
                      const ideaPersona = personas.find((persona) => persona.id === idea.personaId);
                      if (ideaPersona && !ideaPersona.primaryReferenceImageUrl) {
                        return (
                          <p className="mt-2 text-sm text-warning">
                            Set a primary reference image in Personas first to keep this model look consistent.
                          </p>
                        );
                      }

                      return null;
                    })()}
                    {idea.productImageAssets && idea.productImageAssets.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {idea.productImageAssets
                          .filter((asset) => asset.status !== "discarded")
                          .map((asset) => (
                            <div
                              className="rounded-[18px] border border-border/80 bg-white p-3"
                              key={asset.id}
                            >
                              <div className="overflow-hidden rounded-[14px] border border-border/70 bg-accent-soft/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  alt={`${idea.title} generated product visual`}
                                  className="h-40 w-full object-cover"
                                  src={asset.imageUrl}
                                />
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <StatusBadge value={asset.status === "approved" ? "Approved" : "Generated"} />
                                <span className="text-xs text-muted-foreground">
                                  Provider: {asset.provider}
                                </span>
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <button
                                  className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={activeProductImageAssetId !== null}
                                  onClick={() => {
                                    void handleProductImageAssetAction(idea.id, asset.id, "approve");
                                  }}
                                  type="button"
                                >
                                  {activeProductImageAssetId === asset.id ? "Saving..." : "Approve"}
                                </button>
                                <button
                                  className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={activeProductImageAssetId !== null}
                                  onClick={() => {
                                    void handleProductImageAssetAction(idea.id, asset.id, "regenerate");
                                  }}
                                  type="button"
                                >
                                  {activeProductImageAssetId === asset.id ? "Queuing..." : "Regenerate"}
                                </button>
                                <button
                                  className="inline-flex items-center justify-center rounded-full border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={activeProductImageAssetId !== null}
                                  onClick={() => {
                                    void handleProductImageAssetAction(idea.id, asset.id, "discard");
                                  }}
                                  type="button"
                                >
                                  {activeProductImageAssetId === asset.id ? "Saving..." : "Discard"}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No product images yet for this idea.
                      </p>
                    )}
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
                      disabled={activeIdeaId === idea.id || activeGenerationJobId !== null}
                      onClick={() => void handleIdeaAction(idea.id, "regenerate")}
                      type="button"
                    >
                      {activeIdeaId === idea.id && activeIdeaAction === "regenerate"
                        ? "Queuing..."
                        : activeGenerationJobId
                          ? "Preparing..."
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

                    <button
                      className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={
                        activeIdeaId === idea.id ||
                        activeProductImageJobId !== null ||
                        idea.status === "Archived"
                      }
                      onClick={() => void handleIdeaAction(idea.id, "product-images")}
                      type="button"
                    >
                      {activeIdeaId === idea.id && activeIdeaAction === "product-images"
                        ? "Queuing..."
                        : activeProductImageJobId && activeProductImageIdeaId === idea.id
                          ? "Preparing Images..."
                          : "Generate Product Images"}
                    </button>
                    {activeProductImageJobId && activeProductImageIdeaId === idea.id ? (
                      <button
                        className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white"
                        onClick={() =>
                          void refreshProductImageJobStatus(
                            activeProductImageJobId,
                            activeProductImageIdeaId,
                          )
                        }
                        type="button"
                      >
                        Refresh image status
                      </button>
                    ) : null}

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
