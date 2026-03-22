# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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

### Changed
- Updated the dashboard brand snapshot card to reflect the new Brand Profile structure.
- Simplified the Brand Profile data model and seed data to match the new internal admin workflow.
- Updated the Personas page copy and status badge handling to support active and inactive persona states.
- Updated the Product Library and Content Ideas pages to use the new local-first data models and reusable workflow utilities.
- Added publishing-specific typed models so future scheduling or posting integrations can plug into the current admin UI without a rewrite.
- Updated analytics seed data, trend visuals, and navigation so the new reporting and help experiences fit the shared studio shell cleanly.

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
