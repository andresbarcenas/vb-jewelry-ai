# Backend Foundation

This document describes the first persistent backend layer added to VB Jewelry AI Studio while keeping the current UI and workflows intact.

## Scope

This phase introduces:

- Docker-based local environment
- PostgreSQL database
- Redis container for near-term job/queue support
- Prisma ORM
- Server-side repository layer
- API routes for Brand, Personas, and Product Library

No external AI, publishing, or video provider integrations are included yet.

## Local infrastructure

### Docker services

`docker-compose.yml` defines:

- `web`: Next.js app
- `db`: PostgreSQL 16
- `redis`: Redis 7

The `web` port mapping is configurable via `WEB_PORT` (defaults to `3000`) to avoid local port conflicts.

Key env vars used by the app:

- `DATABASE_URL`
- `REDIS_URL`
- `APP_BASE_URL`

### App container

`Dockerfile` builds the Next.js app with `pnpm`, generates Prisma client, and supports runtime startup.

`docker-compose` runs a development command that:

1. installs deps
2. runs Prisma generate
3. pushes schema to DB
4. starts Next dev server

Seed data is run intentionally as a separate command so local edits are not overwritten on every container restart:

```bash
docker compose exec web pnpm db:seed
```

## Prisma setup

Prisma lives under `prisma/`:

- `prisma/schema.prisma`
- `prisma/seed.ts`

Initial models:

- `Brand`
- `Persona`
- `Product`
- `ContentIdea`
- `ReviewItem`
- `PublishingQueue`

The schema maps current mock structures to SQL-backed persistence with arrays/text fields where needed.

## Seed strategy

`prisma/seed.ts` imports existing mock data from `src/data/mock-studio.ts` and seeds all current models.

The mock file is intentionally retained during migration so we can replace section data incrementally without breaking UI.

## Repository layer

Server-side repositories were added in:

- `src/lib/repositories/brand.repository.ts`
- `src/lib/repositories/persona.repository.ts`
- `src/lib/repositories/product.repository.ts`

These expose clear data access functions such as:

- `getBrandProfile`, `saveBrandProfile`, `resetBrandProfile`
- `getPersonas`, `createPersona`, `updatePersona`, `deletePersona`, `resetPersonas`
- `getProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `resetProducts`

Prisma client singleton:

- `src/lib/prisma.ts`

Redis foundation helper:

- `src/lib/redis.ts`

## API layer

Added Node runtime route handlers:

- `src/app/api/brand/*`
- `src/app/api/personas/*`
- `src/app/api/products/*`

These routes call repositories and return JSON responses for the current client-side service layer.

## Progressive migration (no UI break)

Client services for these domains now call API routes first, with mock local persistence fallback:

- `brand.service.ts`
- `persona.service.ts`
- `product.service.ts`

This keeps the app usable even if DB is temporarily unavailable, while allowing immediate persistence when backend is running.

## Commands

Local non-Docker:

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:db:push
pnpm db:seed
pnpm dev
```

Docker:

```bash
docker compose up --build
```

## Notes

- UI and styling are intentionally unchanged in this phase.
- Existing mock-backed sections outside Brand/Personas/Product remain as-is until their migration steps are scheduled.
- External provider integrations are still mocked.
