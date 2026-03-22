# Backend Foundation (Simple Explanation)

This update gives the app a real local data backbone without changing how the screens look.

## What the database does

PostgreSQL now stores your core studio information, including:

- brand profile
- personas
- product library
- content/review/publishing tables for next steps

This means key data can persist between app restarts instead of only living in temporary browser state.

## What Docker does

Docker starts everything your app needs in one command:

- the web app
- the database
- Redis

So your local setup is consistent and easier to run across machines.

## Why Redis is included now

Redis is not heavily used yet, but it is added now so the project is ready for:

- background jobs
- queues
- fast temporary state

That makes future AI/video processing work easier to add without another infrastructure reset.

## What changed right now

- Brand Profile, Personas, and Product Library started using server APIs backed by the database.
- Mock data files are still kept for safety during migration.
- Starter seed data can be loaded once when needed, without resetting your data every time the app restarts.
- The UI style and flows stay the same.

## What did not change yet

- No real OpenAI integration yet
- No real Instagram publishing integration yet
- No real external video provider yet

Those remain mocked while the backend foundation is being built out safely.
