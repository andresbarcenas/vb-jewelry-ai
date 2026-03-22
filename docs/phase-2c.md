# Phase 2C: Real Persistence For Core Studio Data

This phase moves the core business data of VB Jewelry AI Studio to real database-backed persistence while keeping the existing UI, routes, and workflow behavior stable.

## Scope

Phase 2C applies to:

- Brand Profile
- Personas
- Product Library

Unfinished sections remain mock-backed in this phase:

- Content Ideas
- Video Review Queue
- Publishing Queue
- Analytics

## What changed

### Service layer behavior

The client services for Brand, Personas, and Products now rely on internal API routes as their primary persistence path and no longer use browser localStorage mock persistence.

Updated files:

- `src/lib/services/brand.service.ts`
- `src/lib/services/persona.service.ts`
- `src/lib/services/product.service.ts`

Notes:

- Reads now come from API/DB when available.
- Writes now target API/DB flows.
- Legacy local mock-persistence fallback was removed for these three domains.
- Seed defaults are still used as a safe read fallback when API is unavailable, but they are not written to browser storage.

### Repository/data-access layer

The server-side repository layer continues to isolate Prisma/database logic from UI code.

Core functions used for this phase:

- Brand:
  - `getBrandProfile`
  - `updateBrandProfile` (with backward-compatible `saveBrandProfile` alias)
- Personas:
  - `getPersonas`
  - `createPersona`
  - `updatePersona`
- Products:
  - `getProducts`
  - `createProduct`
  - `updateProduct`

### Default development seeding

Repository read methods still seed defaults from `src/data/mock-studio.ts` when DB tables are empty, so development starts with usable data:

- Brand: creates one default brand profile if none exists
- Personas: inserts starter persona set when empty
- Products: inserts starter product set when empty

## Docker and Prisma alignment

Phase 2C keeps Docker + Prisma flow aligned:

- Postgres remains the persistence source of truth for these domains.
- Prisma schema and seed remain compatible with current UI models.
- Docker local development still runs with `web`, `db`, and `redis`.

## Result

VB Jewelry AI Studio now behaves like a persistent application for core business data (Brand, Personas, Product Library), while unfinished workflow areas remain mocked until later phases.
