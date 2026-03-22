# VB Jewelry AI Studio

VB Jewelry AI Studio is an internal admin tool for planning AI-assisted Instagram Reel campaigns.

This app is intentionally simple:
- it uses typed placeholder data instead of a database
- it keeps all eight studio sections inside one shared admin layout
- it is built to be easy to read and easy to replace later with real APIs

## What this project includes

- `Dashboard` for a quick operational overview
- `Brand Profile` for voice, guardrails, and creative rules
- `Personas` for approved campaign personas
- `Product Library` for product assets and metadata
- `Content Ideas` for Reel concepts and hooks
- `Video Review Queue` for draft review status
- `Publishing Queue` for upcoming posts
- `Analytics` for simple performance summaries

## How to run it

Install dependencies if needed:

```bash
pnpm install
```

Start the local app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Simple project structure

- `src/app`
  Next.js routes and layouts. Each folder inside the studio route group becomes one page in the admin tool.

- `src/components/layout`
  The shared shell around the app, including the sidebar and top header.

- `src/components/sections`
  Section-specific interactive panels such as filters, local form state, and tables.

- `src/components/ui`
  Reusable building blocks like cards, badges, tables, and headers.

- `src/config/navigation.ts`
  The sidebar navigation labels, routes, descriptions, and icon names.

- `src/data/mock-studio.ts`
  The main placeholder data file. This is the best place to update sample content later.

- `src/types/studio.ts`
  Shared TypeScript shapes for the studio data.

- `src/lib/format.ts`
  Small formatting helpers for dates and numbers.

## Safest files to edit later

If a non-technical owner or operator wants to make content changes without touching app logic, start here:

- `src/data/mock-studio.ts`
  Change brand copy, persona descriptions, product names, content ideas, and analytics placeholders.

- `src/config/navigation.ts`
  Change sidebar labels or route descriptions.

- `src/app/(studio)/*/page.tsx`
  Change page titles and short intro text at the top of each section.

## Notes about this first version

- There is no login flow yet.
- There is no database yet.
- Form edits are local-only and do not persist after refresh.
- Tables and filters are real UI interactions, but the content is still mock data.
- The structure is meant to make future API integration straightforward without rewriting the whole app.

## Useful commands

```bash
pnpm lint
pnpm typecheck
pnpm build
```
