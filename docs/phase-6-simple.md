# Phase 6 (Simple): “Available Soon” Background Processing

We changed the app so heavy AI work happens in the background instead of making you wait on one long page request.

## What this means for you

- When you click **Generate Ideas** or **Generate Reference Pack**, the request is queued first.
- The app immediately shows that content is being prepared.
- Results appear shortly after, and the page updates automatically.

## Why we did this

- It prevents timeout errors during slower AI runs.
- It keeps the app responsive while generation is in progress.
- It makes the process more reliable, especially for image generation.

## What you will see in the UI

- Friendly status messages like “available soon.”
- Buttons are temporarily disabled while a job is running (to avoid duplicates).
- A manual **Refresh status** button is available if you want to check immediately.

## Behind the scenes

- Redis stores a small queue of pending jobs.
- A dedicated background worker picks jobs up and processes them.
- If a temporary error happens, the worker retries automatically.

This gives us a safer foundation for future image/video providers without changing your day-to-day workflow.
