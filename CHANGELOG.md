# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Rebuilt the Brand Profile section around business-owner-friendly fields including brand voice, target customer, style keywords, do-not-use guidance, preferred colors, product categories, and Instagram handle.
- Added plain-English helper text for each Brand Profile field and a generated brand brief summary panel.
- Added a simple browser-local mock store for Brand Profile data so edits persist locally without a backend.

### Changed
- Updated the dashboard brand snapshot card to reflect the new Brand Profile structure.
- Simplified the Brand Profile data model and seed data to match the new internal admin workflow.

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
