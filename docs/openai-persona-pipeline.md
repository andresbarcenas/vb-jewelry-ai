# OpenAI-First Persona Image Pipeline

This phase adds a reusable persona image workflow powered by OpenAI as the first live media provider.

## What was added

1. Server-only persona image generation service
- Added `src/lib/services/persona-image-generation.service.ts`
- Uses an internal provider-style contract so provider logic is isolated from UI and repository code.
- OpenAI is the first provider and runs server-side only.

2. OpenAI provider behavior
- Reads credentials from environment variables:
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_IMAGE_MODEL`
- Reliability controls:
- `OPENAI_IMAGE_TIMEOUT_MS`
- `OPENAI_IMAGE_RETRY_COUNT`
- `OPENAI_IMAGE_RETRY_DELAY_MS`
- Generates a four-image reference pack per persona:
- hero portrait
- 3/4 body shot
- side profile
- close-up jewelry-friendly shot
- If OpenAI is unavailable or returns no image, a safe fallback placeholder image is stored so the workflow remains usable.
- The service now logs per-shot outcomes (success, timeout, HTTP failure, parse failure, network failure) for faster diagnosis.
- Fallback previews use the on-image label `Reference preview (fallback mode)`.

3. Database persistence for persona reference assets
- Prisma model added: `PersonaAsset`
- Relation: `Persona` -> many `PersonaAsset`
- One asset per persona + shot type via `@@unique([personaId, shotType])`
- Asset stores:
- shot type
- image URL (OpenAI URL or base64/data URL)
- prompt used
- provider
- status (`generated` or `approved`)

4. Repository and API updates
- `src/lib/repositories/persona.repository.ts` now supports:
- generate and persist persona reference pack
- approve/unapprove persona assets
- map persona assets into `AiPersonaProfile.referenceAssets`
- New API routes:
- `POST /api/personas/[id]/reference-pack`
- `PATCH /api/personas/[id]/assets/[assetId]`

5. UI updates in Personas detail view
- Added **Generate Reference Pack** action
- Added reference image grid with clean approval workflow
- Added approve/remove approval button per image
- Added owner-friendly explanation text about consistency and reuse

6. Type updates
- Extended `src/types/persona.ts` with:
- `PersonaReferenceShotType`
- `PersonaAssetStatus`
- `PersonaAsset`
- optional `referenceAssets` on `AiPersonaProfile`

## Why this architecture

- OpenAI-first: gives a live generation foundation now.
- Provider-oriented service: keeps future swaps straightforward (e.g., additional media providers).
- Database-backed assets: approved references can be reused for later product image and video draft workflows.
- UI remains simple and review-friendly for non-technical owners.

## Notes for future phases

- Add a “set as primary reference” marker per shot if needed.
- Support multi-pack history per persona if design direction versions become important.
