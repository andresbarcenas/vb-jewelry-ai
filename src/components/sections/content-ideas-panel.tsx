"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import {
  useStudioContent,
  useStudioPersonas,
  useStudioProducts,
} from "@/lib/studio-data-provider";
import type {
  ContentIdeaType,
  ContentMood,
  ContentPlatform,
  GeneratedContentIdeaCard,
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
  const { generateIdeas, generationOptions } = useStudioContent();
  const [requestedPersonaId, setRequestedPersonaId] = useState("");
  const [requestedProductId, setRequestedProductId] = useState("");
  const [platform, setPlatform] = useState<ContentPlatform>("Instagram Reels");
  const [mood, setMood] = useState<ContentMood>("Elevated");
  const [contentType, setContentType] = useState<ContentIdeaType>("lifestyle");
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedContentIdeaCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  async function handleGenerateIdeas() {
    if (!selectedPersona || !selectedProduct) {
      return;
    }

    setIsGenerating(true);

    try {
      const ideas = await generateIdeas({
        persona: selectedPersona,
        product: selectedProduct,
        platform,
        mood,
        contentType,
      });

      setGeneratedIdeas(ideas);
    } finally {
      setIsGenerating(false);
    }
  }

  if (personas.length === 0 || products.length === 0) {
    return (
      <EmptyState
        title="Create personas and products first"
        description="The Content Ideas generator needs at least one persona and one product in the library before it can produce mock ideas."
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Idea generator"
        description="Choose the persona, product, and creative direction you want, then generate five mocked content ideas. The generation service is set up so this step can later call an AI API."
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

      {generatedIdeas.length === 0 ? (
        <EmptyState
          title="No ideas generated yet"
          description="Choose your inputs above and click Generate Ideas to create five mocked content cards."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {generatedIdeas.map((idea, index) => (
            <SectionCard
              key={idea.id}
              title={`Generated idea ${index + 1}`}
              description={`${contentType} · ${mood} · ${platform}`}
            >
              <div className="space-y-4">
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
                    {idea.conceptSummary}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Visual direction
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {idea.visualDirection}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Caption idea
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {idea.captionIdea}
                  </p>
                </div>

                <div className="rounded-[22px] border border-border/80 bg-accent-soft/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    CTA
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{idea.cta}</p>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
