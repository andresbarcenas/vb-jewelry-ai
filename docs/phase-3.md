# Phase 3: Real AI Content Idea Generation

Phase 3 upgrades the Content Ideas flow from mock generation to real server-side OpenAI generation, while preserving the existing internal admin UI style and workflow.

## What changed

## 1) Server-side OpenAI generation service

Added:

- `src/lib/services/content-generation.service.ts`

This service:

- builds prompts from Brand + Persona + Product + platform + mood + content type
- calls OpenAI server-side only (no client API key exposure)
- requests structured JSON output
- validates and normalizes fields
- applies graceful fallback to mock generation when OpenAI fails
- logs generation start/success/failure events

Environment variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`

## 2) Content Ideas DB persistence

Added:

- `src/lib/repositories/content-idea.repository.ts`

This repository now handles:

- listing content ideas from Postgres
- generating + saving ideas to Postgres
- status updates (`Saved`, `Ready for Review`, `Archived`)
- single-idea regeneration

Prisma model `ContentIdea` was expanded to store Phase 3 fields such as:

- `productId`, `productName`
- `platform`, `mood`, `contentType`
- `visualDirection`, `cta`
- `autoSaved`

## 3) API routes for content ideas

Added:

- `src/app/api/content-ideas/route.ts` (`GET`)
- `src/app/api/content-ideas/generate/route.ts` (`POST`)
- `src/app/api/content-ideas/[id]/route.ts` (`PATCH` actions)

PATCH actions supported:

- `save`
- `send_to_review`
- `archive`
- `regenerate`

## 4) Client content service + provider wiring

Updated:

- `src/lib/services/content.service.ts`
- `src/lib/studio-data-provider.tsx`

Changes:

- removed local mock persistence for Content Ideas
- switched to API-backed generation/list/action flows
- kept video review queue and other unfinished sections on their current mock path

## 5) Content Ideas UI behavior

Updated:

- `src/components/sections/content-ideas-panel.tsx`

Now includes:

- real generation trigger
- loading/success/error states
- auto-saved clarity messaging
- per-card actions: `Regenerate`, `Save`, `Send to Review`, `Archive`
- preserved existing form controls and visual layout style

## 6) Safety and reliability

Implemented:

- structured response validation before persistence
- field-level fallback normalization for incomplete model output
- fallback generation path when OpenAI is unavailable
- structured logging for generation lifecycle and failures

## 7) Prompt quality and brand consistency

Prompt quality directly affects how consistent the brand feels across generated ideas.

- Better prompt structure (system + brand + persona + product + campaign request) keeps output aligned with VB Jewelry voice.
- Explicit guardrails against generic influencer phrasing, exaggerated claims, and spammy CTAs reduce off-brand copy.
- Field-level validation with premium fallbacks ensures ideas stay useful for review handoff even when model output is uneven.

## 8) Scope boundaries preserved

Still not implemented in Phase 3:

- video generation
- Instagram publishing integration
- major UI redesign

Those remain out of scope by design.
