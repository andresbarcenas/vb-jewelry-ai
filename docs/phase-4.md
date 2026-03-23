# Phase 4: Visual Production Foundation (Mock)

Phase 4 prepares the app for the next step after content ideas: turning ideas into visual plans and then into future video assets.

This phase is intentionally provider-agnostic. No real video API integrations were added yet.

## What changed

## 1) Prisma data model updates

`ContentIdea` was extended with:

- `visualPlan` (`String? @db.Text`) for structured plan storage (saved as JSON text)
- relation to `VideoAsset[]`

New `VideoAsset` model:

- `id`
- `contentIdeaId` (relation to `ContentIdea`)
- `status` (`draft`, `generating`, `ready`, `approved`)
- `videoUrl` (optional)
- `thumbnailUrl` (optional)
- `generationNotes`
- `provider`
- `createdAt`
- `updatedAt`

## 2) Visual plan service

Added:

- `src/lib/services/visual-plan.service.ts`

Function:

- `generateVisualPlan(contentIdea)`

Output shape:

- `sceneDescription`
- `lighting`
- `cameraAngle`
- `motion`
- `stylingNotes`

The service uses content idea context (mood, content type, persona, product) to produce consistent mock production guidance.

## 3) Job layer for visual plans

Added:

- `src/lib/jobs/generateVisualPlan.job.ts`

This job:

- simulates async processing
- logs lifecycle events
- returns a structured `JobResult` payload with `visualPlan`

`src/lib/jobs/job.types.ts` now includes `generate-visual-plan`.

## 4) Repository and API integration

`src/lib/repositories/content-idea.repository.ts` now:

- persists and parses `visualPlan`
- ensures each idea has a `VideoAsset` tracking record
- creates draft video assets for seeded/generated ideas
- exposes `generateVisualPlanForIdea(ideaId)`

`src/app/api/content-ideas/[id]/route.ts` now supports:

- `action: "generate_visual_plan"`

## 5) Content Ideas UI updates

`src/components/sections/content-ideas-panel.tsx` now includes:

- `Generate Visual Plan` / `Regenerate Visual Plan` action per idea
- expandable visual plan display
- video asset tracking panel with status badge
- placeholder messaging: `Video not generated yet`

The UI remains non-technical and keeps the existing content-idea workflow intact.

## Scope boundaries preserved

Still not implemented in Phase 4:

- real video generation provider integrations
- real thumbnail generation providers
- real storage/CDN workflows for video outputs

Those will plug into this foundation in a future phase without requiring a UI redesign.
