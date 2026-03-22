# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2026-03-22

### Changed
- Refactored the OpenAI prompt builder into clear sections (`system instructions`, `brand context`, `persona context`, `product context`, `campaign request`) to improve output consistency and maintainability.
- Strengthened generation guardrails to avoid generic influencer phrasing, exaggerated product claims, and spam-style CTAs.
- Added field-level quality validation for generated ideas so short or generic values are replaced with premium, context-aware fallbacks before persistence.
- Preserved and hardened persistence of generation context fields (`platform`, `mood`, `contentType`, `visualDirection`, `cta`) for cleaner downstream review handoff.
- Added a clean `ready_for_review` action path (while keeping `send_to_review` compatibility) for future Review Queue integration.
- Updated Phase 3 docs with a short note on why prompt quality directly impacts brand consistency.

## [1.2.0] - 2026-03-22

### Added
- Added a server-only OpenAI content generation service (`src/lib/services/content-generation.service.ts`) that composes prompts from Brand Profile, Persona, Product, mood, content type, and platform.
- Added structured content idea generation with required fields (`title`, `hook`, `conceptSummary`, `visualDirection`, `captionAngle`, `cta`, `priority`) and support for generating 3 to 5 ideas per request.
- Added new Content Ideas API routes for listing, generating, and updating idea actions (`save`, `send_to_review`, `archive`, `regenerate`).
- Added database-backed content idea repository logic to save generated ideas, associate persona/product, track timestamps, and support review readiness updates.
- Added Phase 3 documentation for technical and business audiences (`docs/phase-3.md`, `docs/phase-3-simple.md`).

### Changed
- Replaced mocked Content Ideas generation flow with real server-side AI generation while keeping the existing page layout and controls.
- Updated Content Ideas cards to support real workflow actions: `Regenerate`, `Save`, `Send to Review`, and `Archive`, including loading/success/error states.
- Expanded Prisma `ContentIdea` persistence fields to store generation context (platform, mood, content type), visual direction, CTA, autosave state, and product linkage.
- Updated `StudioDataProvider` and content services to refresh state from API-backed persistence instead of local mock storage for Content Ideas.
- Updated Docker and environment configuration to support OpenAI settings (`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`).

### Notes
- If OpenAI is unavailable or not configured, Content Ideas generation gracefully falls back to structured mock output so the workflow remains usable.

## [1.1.0] - 2026-03-22

### Added
- Rebuilt the Brand Profile section around business-owner-friendly fields including brand voice, target customer, style keywords, do-not-use guidance, preferred colors, product categories, and Instagram handle.
- Added plain-English helper text for each Brand Profile field and a generated brand brief summary panel.
- Added a simple browser-local mock store for Brand Profile data so edits persist locally without a backend.
- Rebuilt the Personas section as a local persona manager that supports creating and saving up to five fictional AI personas.
- Added persona cards with photo placeholders, editable persona details, and browser-local mock storage for persona data.
- Rebuilt the Product Library section with a mock upload workflow, clear product-entry guidance, filterable product cards, and browser-local storage for saved items.
- Added a structured Content Ideas generator flow with persona, product, platform, mood, and content-type controls plus five mocked AI-ready output cards.
- Rebuilt the Publishing Queue section as a local approval workflow with posting fields, manual Ready to Publish handling, business-approval warnings, and future integration helpers.
- Added a simplified Analytics dashboard with mock performance metrics, lightweight charts, and plain-English insights for business owners.
- Added an in-app "How This Works" guide that explains the studio workflow in simple, non-technical language.
- Added an integration-ready service layer under `src/lib/services` for brand, persona, product, content, publishing, analytics, and AI domains.
- Added a mock job pipeline under `src/lib/jobs` with shared `JobResult<T>` output for content generation, video generation, review decisions, and publish attempts.
- Added a structured logger (`src/lib/logger.ts`) for content generation, approvals/rejections, publish attempts, and job lifecycle events.
- Added typed provider placeholders in `src/config/app.config.ts` and a dashboard System Status panel showing AI, video, and publishing connectivity states.
- Added architecture docs (`docs/architecture.md` and `docs/architecture-simple.md`) for both technical and non-technical audiences.
- Upgraded Personas into a creative control center with richer cards, quick-tag filtering, detail view sections, and a default prompt preview area.
- Added four realistic VB Jewelry starter personas for generation planning: Lena (polished everyday), Sofia (event ready), Camila (warm artisan lifestyle), and Maya (trend-aware minimal).
- Added Docker-based local development with `web`, `db` (PostgreSQL), and `redis` services, plus a production-ready app Dockerfile and `.env.example`.
- Added Prisma ORM foundation with PostgreSQL datasource, initial schema models (`Brand`, `Persona`, `Product`, `ContentIdea`, `ReviewItem`, `PublishingQueue`), and a mock-data seed script.
- Added backend API routes and repository modules for Brand Profile, Personas, and Product Library persistence.
- Added backend foundation docs for both technical and non-technical audiences (`docs/backend-foundation.md`, `docs/backend-foundation-simple.md`).

### Changed
- Updated the dashboard brand snapshot card to reflect the new Brand Profile structure.
- Simplified the Brand Profile data model and seed data to match the new internal admin workflow.
- Updated the Personas page copy and status badge handling to support active and inactive persona states.
- Updated the Product Library and Content Ideas pages to use the new local-first data models and reusable workflow utilities.
- Added publishing-specific typed models so future scheduling or posting integrations can plug into the current admin UI without a rewrite.
- Updated analytics seed data, trend visuals, and navigation so the new reporting and help experiences fit the shared studio shell cleanly.
- Refactored all studio routes to use one shared `StudioDataProvider` and provider hooks instead of direct `mock-studio` imports in UI pages.
- Rewired Brand Profile, Personas, Product Library, Content Ideas, Video Review Queue, Publishing Queue, Dashboard, and Analytics panels to read and mutate provider-backed service state.
- Split shared domain models into `src/types/brand.ts`, `persona.ts`, `product.ts`, `content.ts`, `video.ts`, and `publishing.ts` while keeping `src/types/studio.ts` as a compatibility barrel.
- Converted `src/data/mock-studio.ts` into a seed/default data source for services and retired legacy standalone local-store modules from UI usage.
- Verified `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass, and smoke-tested all studio routes including `/how-this-works`.
- Expanded the persona model for AI-ready creative control (`label`, `bestUseCases`, `contentTone`, `recommendedScenes`, `preferredColors`, `jewelryFit`, `avoidList`, `promptStarter`, and `recommendedFor` guidance).
- Updated persona service normalization to support new fields while handling older local mock data formats.
- Updated content-idea persona usage to align with new persona status values and scene/tone fields.
- Updated Brand Profile, Personas, and Product Library services to use backend APIs first with safe local mock fallback during phased migration.
- Updated Docker startup flow to preserve local database edits by default, with seeding run manually when needed.
- Updated Docker compose web startup to run reliably in non-interactive environments (`CI=true`) and support configurable host port mapping via `WEB_PORT`.

### Notes
- This release introduces the initial Docker local development implementation with PostgreSQL, Redis, Prisma, and server-side data access foundations while preserving the current UI.

## [1.0.0] - 2026-03-22

### Added
- Initial production-ready internal admin app for VB Jewelry AI Studio built with Next.js, TypeScript, and Tailwind CSS.
- Shared studio shell with responsive sidebar navigation, sticky top bar, and root redirect to the dashboard.
- Eight internal sections: Dashboard, Brand Profile, Personas, Product Library, Content Ideas, Video Review Queue, Publishing Queue, and Analytics.
- Reusable admin UI components for headers, cards, badges, tables, filters, empty states, and lightweight analytics visuals.
- Centralized typed placeholder data for brand profile, personas, products, idea pipeline, review queue, publishing queue, and analytics snapshots.
- Plain-English README explaining the project structure, safe editing points, and local commands.

### Notes
- This release is intentionally frontend-only and uses local placeholder state with no backend, authentication, or persistence yet.
