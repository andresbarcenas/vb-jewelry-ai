# Phase 6: Async OpenAI Worker Pipeline

Phase 6 moves long OpenAI work out of API request/response paths and into a Redis-backed worker loop.

## What Changed

- Added a Redis job queue with typed job records:
  - `content_generation`
  - `persona_reference_pack`
- Added a dedicated AI worker process that:
  - pulls queued jobs
  - runs existing OpenAI generation services
  - retries failed jobs with backoff
  - writes structured lifecycle logs
- Updated API behavior:
  - `POST /api/content-ideas/generate` now enqueues and returns `202`.
  - `POST /api/personas/[id]/reference-pack` now enqueues and returns `202`.
  - Added `GET /api/jobs/[id]` for status polling.
- Updated frontend flows:
  - Content Ideas and Personas now show a queued/processing state.
  - Both screens poll every 5 seconds and also include manual refresh.
  - On completion, UI refreshes from persisted DB state.

## Why This Helps

- Avoids request timeouts for expensive OpenAI calls.
- Keeps web routes fast and predictable.
- Improves reliability with retry logic in one place.
- Makes future providers (video/image generation) easier to add with the same queue pattern.

## Runtime Notes

- Queue uses Redis keys:
  - `vb-jewelry-ai:queue:jobs`
  - `vb-jewelry-ai:queue:delayed`
  - `vb-jewelry-ai:job:<id>`
- Worker settings are env-driven:
  - `AI_QUEUE_POLL_INTERVAL_MS`
  - `AI_JOB_MAX_ATTEMPTS`
  - `AI_JOB_BACKOFF_MS`
- Docker Compose now runs a dedicated `worker` service alongside `web`, `db`, and `redis`.

## Troubleshooting

- Follow logs:
  - `docker compose logs -f web worker`
- If jobs stay queued:
  - check `REDIS_URL` in both `web` and `worker`
  - confirm worker container is running
- If jobs fail repeatedly:
  - inspect `[studio-log]` entries for `job_failed` and OpenAI error metadata.
