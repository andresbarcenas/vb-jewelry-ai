import type {
  ContentIdea,
  ContentIdeaType,
  ContentMood,
  VisualPlan,
} from "@/types/studio";

const lightingByMood: Record<ContentMood, string> = {
  Elevated:
    "Use soft directional key light with gentle fill to keep metal highlights refined and controlled.",
  Romantic:
    "Use warm diffused light with subtle shadow falloff and a soft glow on skin tones.",
  Warm:
    "Use natural window-style light with warm bounce cards to preserve handcrafted texture.",
  Editorial:
    "Use contrast-forward lighting with clean shadows and intentional highlight roll-off.",
  Playful:
    "Use bright balanced light with small sparkle accents and even exposure across motion shots.",
  Minimal:
    "Use clean neutral light with low-contrast backgrounds and crisp edge definition on jewelry.",
};

const cameraByContentType: Record<ContentIdeaType, string> = {
  lifestyle:
    "Start with medium framing, then move into close detail cuts that show how the piece wears in real movement.",
  luxury:
    "Use slow cinematic push-ins and macro detail framing that emphasizes finish, polish, and craftsmanship.",
  casual:
    "Use shoulder-level framing and quick detail inserts that keep the styling approachable and real.",
  story:
    "Use sequential shots: setup, texture close-up, and final hero framing to support a narrative arc.",
  "gift idea":
    "Use gift-context framing with hands, packaging details, and a final on-body hero close-up.",
  trendy:
    "Use fast opening hooks, then stabilize into polished close-ups for trend-aware but brand-safe pacing.",
};

const motionByContentType: Record<ContentIdeaType, string> = {
  lifestyle: "Slow hand movement, mirror turn, and one clean walk-by transition.",
  luxury: "Controlled glide shots and minimal but elegant motion with steady pacing.",
  casual: "Natural movement with small styling adjustments and short transition beats.",
  story: "Narrative-paced motion with one reveal moment and one detail pause.",
  "gift idea": "Unwrap reveal, handoff gesture, and a calm final hero hold.",
  trendy: "Quick opener, dynamic cut-ins, then smooth hero hold to finish.",
};

function lower(value: string) {
  return value.trim().toLowerCase();
}

function buildSceneDescription(idea: ContentIdea) {
  const product = idea.productName ?? idea.products[0] ?? "the featured piece";
  const mood = lower(idea.mood ?? "Elevated");
  const type = lower(idea.contentType ?? "lifestyle");

  return `Feature ${product} in a ${mood} ${type} setup that feels premium, handcrafted, and wearable. Start with the hook moment, then transition into detail-focused shots that reinforce artisan quality.`;
}

function buildStylingNotes(idea: ContentIdea) {
  const persona = idea.personaName;
  const product = idea.productName ?? idea.products[0] ?? "the featured jewelry piece";

  return `Style ${persona} in clean, uncluttered outfits that keep attention on ${product}. Use one supporting prop at most, avoid trend-heavy clutter, and keep color choices aligned with the brand's polished handmade aesthetic.`;
}

export function generateVisualPlan(contentIdea: ContentIdea): VisualPlan {
  const mood = contentIdea.mood ?? "Elevated";
  const contentType = contentIdea.contentType ?? "lifestyle";

  return {
    sceneDescription: buildSceneDescription(contentIdea),
    lighting: lightingByMood[mood],
    cameraAngle: cameraByContentType[contentType],
    motion: motionByContentType[contentType],
    stylingNotes: buildStylingNotes(contentIdea),
  };
}
