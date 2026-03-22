import { appConfig } from "@/config/app.config";
import type {
  ContentIdeaGeneratorInput,
  ContentIdeaPriority,
  ContentIdeaType,
  ContentMood,
  ContentPlatform,
  GeneratedContentIdeaCard,
} from "@/types/studio";

export interface AiProviderStatus {
  label: string;
  mode: "mock" | "live";
  status: "connected" | "not_connected";
}

export const contentPlatformOptions: ContentPlatform[] = ["Instagram Reels"];

export const contentMoodOptions: ContentMood[] = [
  "Elevated",
  "Romantic",
  "Warm",
  "Editorial",
  "Playful",
  "Minimal",
];

export const contentTypeOptions: ContentIdeaType[] = [
  "lifestyle",
  "luxury",
  "casual",
  "story",
  "gift idea",
  "trendy",
];

const ctaOptions = [
  "Save this idea for your next jewelry post.",
  "Tap through to explore the piece up close.",
  "Share this with someone who would wear this look.",
  "Keep this as inspiration for your next Reel concept.",
  "See the full collection details in the studio.",
];

const priorityOrder: ContentIdeaPriority[] = ["High", "Medium", "Medium", "Low", "Low"];

const hookTemplates: Record<ContentIdeaType, string[]> = {
  lifestyle: [
    "The jewelry detail that makes an everyday outfit feel finished",
    "If your outfit needs one easy upgrade, start here",
    "The small styling change that makes basics feel more intentional",
  ],
  luxury: [
    "The piece that gives the whole look a quieter kind of luxury",
    "For the moment when one refined detail says enough",
    "The finish, texture, and polish that make this feel elevated",
  ],
  casual: [
    "How to make a casual look feel pulled together in seconds",
    "Proof that relaxed styling can still feel polished",
    "A low-effort jewelry moment that still looks considered",
  ],
  story: [
    "The detail behind this piece that people usually miss first",
    "Why this jewelry moment deserves a closer look",
    "The story this piece tells before anyone asks about it",
  ],
  "gift idea": [
    "A gift idea that feels personal without feeling complicated",
    "The kind of jewelry gift that still feels thoughtful years later",
    "When you want a gift that looks special right away",
  ],
  trendy: [
    "A trend-forward look that still fits the brand",
    "How to make a current styling trend feel more refined",
    "A fresh Reel angle that still feels polished and wearable",
  ],
};

const visualDirectionTemplates: Record<ContentMood, string[]> = {
  Elevated: [
    "Use clean backgrounds, slow camera movement, and close-up texture shots with soft light.",
    "Start with a polished outfit detail, then move into macro jewelry shots and graceful hand motion.",
  ],
  Romantic: [
    "Use warm light, soft fabric, and slower transitions with delicate close-up movement.",
    "Lean into blush, cream, and airy styling with intimate framing around the jewelry.",
  ],
  Warm: [
    "Use natural light, skin-close framing, and inviting styling details that feel personal.",
    "Show the product in a lived-in setting with tactile movement and gentle shadows.",
  ],
  Editorial: [
    "Use structured framing, dramatic spacing, and composed product shots with a cinematic pace.",
    "Open with a strong silhouette, then cut to close-up detail and texture-rich angles.",
  ],
  Playful: [
    "Keep the cuts light and quick with movement, smile moments, and styling comparisons.",
    "Use mirror checks, hand movement, and easy outfit transitions that feel energetic but still refined.",
  ],
  Minimal: [
    "Keep the set quiet, the styling restrained, and the focus on one clear product moment.",
    "Use lots of clean space, subtle movement, and uncluttered close-ups of the jewelry finish.",
  ],
};

function pickFromList(items: string[], index: number) {
  return items[index % items.length];
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildTitle(input: ContentIdeaGeneratorInput, index: number) {
  const scenario =
    input.persona.recommendedScenes[index % input.persona.recommendedScenes.length];
  const condensedScenario = scenario.split(" ").slice(0, 4).join(" ");

  return `${toTitleCase(input.contentType)}: ${input.product.productName} for ${condensedScenario}`;
}

function buildConceptSummary(input: ContentIdeaGeneratorInput, index: number) {
  const scenario =
    input.persona.recommendedScenes[index % input.persona.recommendedScenes.length];
  const styleTag = input.product.styleTags[index % input.product.styleTags.length];

  return `${input.persona.name} presents ${input.product.productName} as a ${toTitleCase(input.contentType)} idea for ${input.platform}. The Reel leans into a ${input.mood.toLowerCase()} mood, highlights the ${styleTag.toLowerCase()} angle, and uses a scene like "${scenario}" to keep visuals consistent with this persona.`;
}

function buildCaptionIdea(input: ContentIdeaGeneratorInput, index: number) {
  const scenario =
    input.persona.recommendedScenes[index % input.persona.recommendedScenes.length];

  return `${input.persona.name} gives ${input.product.productName} a ${input.mood.toLowerCase()} ${input.contentType} angle for ${input.product.category.toLowerCase()} content. Tie the caption to ${scenario.toLowerCase()} and mention the ${input.product.material.toLowerCase()} finish using a ${input.persona.contentTone.toLowerCase()} voice.`;
}

export async function generateContentIdeas(
  input: ContentIdeaGeneratorInput,
  count = 5,
): Promise<GeneratedContentIdeaCard[]> {
  await new Promise((resolve) => {
    setTimeout(resolve, 350);
  });

  return Array.from({ length: count }, (_, index) => ({
    id: `${input.persona.id}-${input.product.id}-${input.contentType}-${index + 1}`,
    title: buildTitle(input, index),
    hook: pickFromList(hookTemplates[input.contentType], index),
    conceptSummary: buildConceptSummary(input, index),
    visualDirection: pickFromList(visualDirectionTemplates[input.mood], index),
    captionAngle: buildCaptionIdea(input, index),
    cta: pickFromList(ctaOptions, index),
    priority: priorityOrder[index % priorityOrder.length],
  }));
}

export async function getAiProviderStatus(): Promise<AiProviderStatus> {
  const provider = appConfig.providers.ai;

  return {
    label: provider.name,
    mode: provider.mode,
    status: provider.status,
  };
}
