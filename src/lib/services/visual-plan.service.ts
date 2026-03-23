import type {
  ContentIdea,
  ContentIdeaType,
  ContentMood,
  VisualPlan,
} from "@/types/studio";

const lightingByMood: Record<ContentMood, string> = {
  Elevated:
    "Use soft directional key light with gentle fill so metal highlights stay clean and skin tones stay natural.",
  Romantic:
    "Use warm diffused light with slight falloff and a soft glow on jewelry edges and neckline details.",
  Warm:
    "Use natural window-style light with warm bounce fill to keep handcrafted texture visible.",
  Editorial:
    "Use controlled contrast lighting with clean shadows and sharp edge definition around the product.",
  Playful:
    "Use bright even light with one sparkle accent to keep motion energetic but still premium.",
  Minimal:
    "Use neutral low-contrast lighting with a restrained palette and clear product edges.",
};

const cameraByContentType: Record<ContentIdeaType, string> = {
  lifestyle:
    "Begin with medium framing, then move into close detail shots that keep the jewelry centered in frame.",
  luxury:
    "Use slow cinematic push-ins and macro close-ups with controlled depth of field on handcrafted details.",
  casual:
    "Use shoulder-level framing with natural movement, then cut to concise product close-ups.",
  story:
    "Use narrative progression shots: opening context, detail reveal, and closing hero frame.",
  "gift idea":
    "Use gifting context framing with hand interaction, packaging detail, and a final on-body hero shot.",
  trendy:
    "Use a quick hook frame followed by polished close-up inserts and a stable final hero hold.",
};

const motionByContentType: Record<ContentIdeaType, string> = {
  lifestyle: "Use gentle hand movement, one mirror turn, and a smooth walk-by transition.",
  luxury: "Use slow glide movement and minimal transitions to preserve an elevated pacing.",
  casual: "Use natural body movement with short practical transitions and one detail pause.",
  story: "Use reveal pacing with one narrative pause and one final product emphasis beat.",
  "gift idea": "Use unwrap motion, handoff gesture, and a calm final hold on product finish.",
  trendy: "Use quick opening movement, then settle into stable close-up product clarity.",
};

const sceneMoodByMood: Record<ContentMood, string> = {
  Elevated: "Refined and polished with calm confidence.",
  Romantic: "Soft, intimate, and graceful.",
  Warm: "Inviting, tactile, and personal.",
  Editorial: "Composed, modern, and directional.",
  Playful: "Light, energetic, and expressive.",
  Minimal: "Clean, restrained, and modern.",
};

const backgroundByMood: Record<ContentMood, string> = {
  Elevated: "Neutral cream or warm stone backdrop with minimal texture.",
  Romantic: "Soft blush or warm linen background with subtle fabric depth.",
  Warm: "Natural wood or matte clay-toned surface with gentle texture.",
  Editorial: "Structured matte neutral set with intentional negative space.",
  Playful: "Bright neutral backdrop with one accent prop only.",
  Minimal: "Clean ivory or cool neutral seamless backdrop without clutter.",
};

const productFocusByContentType: Record<ContentIdeaType, string> = {
  lifestyle:
    "Keep the piece visible in every shot and clearly show how it sits on the body during real movement.",
  luxury:
    "Prioritize clasp, finish, and material detail with close-ups that keep the jewelry as the visual hero.",
  casual:
    "Show comfort and wearability by keeping product shape and scale readable in each frame.",
  story:
    "Use one signature detail as the anchor and return to it across the sequence for continuity.",
  "gift idea":
    "Highlight gift-worthiness through presentation detail and clear on-body product visibility.",
  trendy:
    "Open with a trend-relevant framing, but maintain clear uninterrupted product visibility.",
};

const avoidByContentType: Record<ContentIdeaType, string> = {
  lifestyle:
    "Avoid cluttered backgrounds, face-only framing, or outfit-heavy shots where the jewelry is hard to see.",
  luxury:
    "Avoid overexposed sparkle, fast cuts, or dramatic filters that hide handcrafted detail.",
  casual:
    "Avoid shaky handheld footage, distracting props, or styling that competes with the product.",
  story:
    "Avoid abstract transitions that break continuity or reduce product clarity.",
  "gift idea":
    "Avoid generic gift clichés and avoid wrapping-only shots without clear product visibility.",
  trendy:
    "Avoid trend slang overlays and avoid chaotic edits that reduce product legibility.",
};

function lower(value: string) {
  return value.trim().toLowerCase();
}

function buildSceneDescription(idea: ContentIdea) {
  const product = idea.productName ?? idea.products[0] ?? "the featured piece";
  const mood = lower(idea.mood ?? "Elevated");
  const type = lower(idea.contentType ?? "lifestyle");

  return `Feature ${product} in a ${mood} ${type} setup that looks handcrafted and premium. Start with a clear hook frame, then move into detail-focused product shots with consistent jewelry visibility in each scene.`;
}

function buildStylingNotes(idea: ContentIdea) {
  const persona = idea.personaName;
  const product = idea.productName ?? idea.products[0] ?? "the featured jewelry piece";

  return `Style ${persona} in clean, uncluttered outfits that keep attention on ${product}. Keep accessories minimal, avoid loud patterns, and maintain a palette that supports product visibility in close and mid shots.`;
}

function buildShotSequence(idea: ContentIdea) {
  const product = idea.productName ?? idea.products[0] ?? "the product";
  const persona = idea.personaName;

  return [
    `Hook shot: open on ${product} in motion with the piece centered and fully visible for at least one second.`,
    `Context shot: show ${persona} in a medium frame that establishes outfit and mood while keeping ${product} clearly readable.`,
    `Detail shot: capture a macro close-up of texture, clasp, or finishing detail with controlled lighting.`,
    `Wearability shot: show natural movement (turn, walk-by, or hand gesture) while keeping product silhouette visible.`,
    `Hero close: end on a stable hero frame with clean background and clear product focus for CTA/caption handoff.`,
  ];
}

export function buildVisualPlanPrompt(contentIdea: ContentIdea) {
  const product = contentIdea.productName ?? contentIdea.products[0] ?? "the featured product";

  return [
    "SYSTEM INSTRUCTIONS",
    "Create a structured visual plan for a handcrafted jewelry video concept.",
    "Be visually specific and production-ready.",
    "Always include explicit product visibility guidance.",
    "Avoid vague wording like 'nice setting' or 'stylish look'.",
    "",
    "IDEA CONTEXT",
    `Title: ${contentIdea.title}`,
    `Persona: ${contentIdea.personaName}`,
    `Product: ${product}`,
    `Mood: ${contentIdea.mood ?? "Elevated"}`,
    `Content type: ${contentIdea.contentType ?? "lifestyle"}`,
    `Concept: ${contentIdea.concept}`,
    "",
    "OUTPUT REQUIREMENTS",
    "- sceneDescription: specific scene setup with clear product visibility expectations",
    "- lighting: exact lighting guidance for reflective jewelry surfaces",
    "- cameraAngle: framing guidance that keeps product legible",
    "- motion: movement guidance that does not hide the product",
    "- stylingNotes: wardrobe and prop guidance for clarity",
    "- productFocus: concrete rule for what to keep visible",
    "- sceneMood: concise mood description",
    "- background: specific background direction",
    "- avoid: clear things the editor should not do",
    "- shotSequence: 4-6 ordered production steps",
  ].join("\n");
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
    productFocus: productFocusByContentType[contentType],
    sceneMood: sceneMoodByMood[mood],
    background: backgroundByMood[mood],
    avoid: avoidByContentType[contentType],
    shotSequence: buildShotSequence(contentIdea),
  };
}
