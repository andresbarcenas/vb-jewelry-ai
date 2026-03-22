# VB Jewelry AI Studio Architecture

## Goals

- Keep the existing internal UI stable and readable.
- Move all data access/mutations behind async service boundaries.
- Prepare for real integrations (AI, video, storage, publishing) without route-level rewrites.

## High-level flow

1. UI sections call provider hooks (`useStudioBrand`, `useStudioPersonas`, etc.).
2. Hooks are backed by `StudioDataProvider` (`src/lib/studio-data-provider.tsx`).
3. Provider actions call domain services in `src/lib/services/*`.
4. Services use mock persistence + seed data (`src/data/mock-studio.ts`) today.
5. Some service actions trigger mocked jobs in `src/lib/jobs/*`.
6. Jobs emit structured events through `src/lib/logger.ts`.

This gives one consistent integration point for future API swaps.

## Type system layout

Domain models are split by concern:

- `src/types/brand.ts`
- `src/types/persona.ts`
- `src/types/product.ts`
- `src/types/content.ts` (includes content generation and analytics snapshot types)
- `src/types/video.ts`
- `src/types/publishing.ts`

`src/types/studio.ts` remains a compatibility barrel for:

- UI-only shared types (`StudioIconName`, `NavItem`, `DashboardStat`)
- Re-exports of all domain model files

## Services layer

All services are plain async modules (no classes), so consumers always use `Promise` contracts:

- `brand.service.ts`
  - `getBrandProfile`
  - `saveBrandProfile`
  - `resetBrandProfile`
- `persona.service.ts`
  - `listPersonas`
  - `createPersona`
  - `updatePersona`
  - `deletePersona`
  - `resetPersonas`
- `product.service.ts`
  - `listProducts`
  - `createProduct`
  - `updateProduct`
  - `deleteProduct`
  - `resetProducts`
- `ai.service.ts`
  - `generateContentIdeas`
  - `getAiProviderStatus`
- `content.service.ts`
  - `listContentIdeas`
  - `generateIdeas`
  - `listVideoReviewQueue`
  - `approveReview`
  - `rejectReview`
  - `requestVideoGeneration`
  - `getGenerationOptions`
- `publishing.service.ts`
  - `listPublishingQueue`
  - `savePublishingItem`
  - `markReadyToPublish`
  - `attemptPublish`
  - `getPublishingOptions`
- `analytics.service.ts`
  - `getAnalyticsSnapshot`
  - `getDashboardSummary`
  - `getSystemStatus`

## Mock persistence

`src/lib/services/mock-persistence.ts` is the shared storage helper:

- Reads from `localStorage` on the client when available
- Falls back to seed/default values
- Normalizes incoming data through service-provided mapping logic
- Keeps an in-memory cache for repeated reads in-session

## Jobs pipeline

Jobs return a shared `JobResult<T>` (`src/lib/jobs/job.types.ts`):

- `jobId`
- `jobType`
- `status`
- `startedAt`
- `completedAt`
- `message`
- `data`

Implemented jobs:

- `generateContent.job.ts`
- `generateVideo.job.ts`
- `reviewContent.job.ts`
- `publishContent.job.ts`

Current wiring:

- Content idea generation path:
  - `content.service.generateIdeas` -> `runGenerateContentJob` -> `ai.service.generateContentIdeas`
- Publishing attempt path:
  - `publishing.service.attemptPublish` -> `runPublishContentJob`

## Logging

`src/lib/logger.ts` exposes `logEvent({...})` with typed fields:

- event `type`
- `domain`
- `action`
- human-readable `message`
- optional `metadata`

It currently logs to console (and keeps in-memory history) for:

- content generation
- approvals
- rejections
- publishing attempts
- job start/completion

## Config and provider placeholders

`src/config/app.config.ts` defines typed placeholder providers for:

- AI provider
- video provider
- storage provider
- Instagram provider

Each provider has:

- `name`
- `mode` (`mock` | `live`)
- `status` (`connected` | `not_connected`)

Dashboard system status is derived from this config.

## UI data integration

All studio routes are wrapped once in `src/app/(studio)/layout.tsx`:

- `StudioDataProvider`
- `StudioShell` (existing visual shell/layout)

Section pages keep the same UI and route behavior, but now consume provider-backed state instead of importing mock data/store files directly.

## Future API replacement strategy

When integrating real systems:

1. Replace service internals, keep service function signatures stable.
2. Keep provider hook contracts unchanged for UI continuity.
3. Keep jobs as orchestration wrappers (or map to external queue workers).
4. Extend logger to external sinks if needed.
5. Flip provider config statuses/modes as integrations become live.

This approach minimizes UI churn and keeps internal workflows understandable while backend capabilities expand.
