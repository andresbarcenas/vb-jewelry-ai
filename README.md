# VB Jewelry AI Studio

VB Jewelry AI Studio is an internal admin tool for planning AI-assisted Instagram Reel campaigns.

This app is intentionally practical and maintainable:
- it keeps the current UI fully mocked for safe testing
- it routes all data through async services so real APIs can be added later
- it uses one shared studio provider so screens do not manage data in isolation

## What this project includes

- `Dashboard` for a quick operational overview
- `How This Works` for non-technical onboarding
- `Brand Profile` for voice, guardrails, and creative rules
- `Personas` for approved campaign personas
- `Product Library` for product assets and metadata
- `Content Ideas` for Reel concepts and hooks
- `Video Review Queue` for draft review status
- `Publishing Queue` for upcoming posts
- `Analytics` for simple performance summaries

## Run locally

Install dependencies:

```bash
pnpm install
```

Start development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Build and quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Project structure (plain English)

- `src/app`
  Route files and shared layouts. `src/app/(studio)/layout.tsx` wraps all internal pages with the shared shell and data provider.

- `src/components/layout`
  Sidebar + top header for the internal admin shell.

- `src/components/sections`
  Page-level panels (Brand, Personas, Product Library, Content Ideas, Publishing Queue, Analytics, etc.).

- `src/components/ui`
  Reusable UI blocks (cards, tables, badges, filters, empty states, trend bars).

- `src/lib/services`
  Async service functions for each domain (`brand`, `persona`, `product`, `content`, `publishing`, `analytics`, `ai`).

- `src/lib/jobs`
  Mock async pipeline jobs that simulate generation/review/publish workflows and return structured `JobResult` values.

- `src/lib/studio-data-provider.tsx`
  Shared React context/hooks used by all screens (`useStudioBrand`, `useStudioPersonas`, etc.).

- `src/lib/logger.ts`
  Structured console logger for content generation, approvals/rejections, publishing attempts, and job lifecycle events.

- `src/config`
  Navigation and provider placeholders (`app.config.ts`) for AI/video/storage/Instagram connection modes.

- `src/data/mock-studio.ts`
  Seed/default mock data. Services use this as the initial source when nothing is saved locally yet.

- `src/types`
  Domain model files (`brand.ts`, `persona.ts`, `product.ts`, `content.ts`, `video.ts`, `publishing.ts`) plus `studio.ts` compatibility exports.

- `docs/architecture.md`
  Technical architecture notes for developers.

- `docs/architecture-simple.md`
  Plain-English explanation for non-technical owners.

## How mock data is wired

1. Seed data starts in `src/data/mock-studio.ts`.
2. Services in `src/lib/services` read/write mock state (browser local storage on client).
3. `StudioDataProvider` loads service data and exposes hooks to UI sections.
4. Section panels call provider actions instead of importing mock files directly.
5. Jobs/logging run through the same service layer, so future API integrations can be swapped in without redesigning pages.

## Safest files to edit later

If you want to update business-facing content without changing app logic, start here:

- `src/data/mock-studio.ts`
  Update seed copy for brand profile, personas, products, queue entries, and analytics placeholders.

- `src/config/navigation.ts`
  Update sidebar labels and descriptions.

- `src/app/(studio)/*/page.tsx`
  Update page header titles and top-level descriptions.

## Current scope (v1)

- There is no login flow yet.
- There is no database yet.
- There are no real external API calls yet (AI/video/storage/publishing are mocked).
- Data persists in browser-local mock storage for internal testing.
- The architecture is prepared for later integrations without changing the current owner-facing UI.
