# How The App Is Structured (Simple Version)

This app is set up so it feels simple to use today, but can grow later without forcing a redesign.

## What is mocked right now?

- AI idea generation is mocked.
- Video generation/review steps are mocked.
- Publishing is mocked (no live Instagram posting).
- Data is saved locally in your browser for testing.

So when you see **Mock Connected**, it means:

- the feature is wired in the app structure
- but it is still using safe fake data/services, not a live external system

## What are “services”?

Think of services as the app’s internal team members:

- one handles brand profile data
- one handles personas
- one handles products
- one handles content ideas
- one handles publishing
- one handles analytics

Screens do not read raw files directly anymore. They ask services for data.  
This is important because later we can swap a service from “mock” to “real API” without changing the screen layout.

## Why are there “jobs”?

Some work is naturally step-by-step (generate ideas, review, publish).  
Jobs simulate that process now, including small delays and status results.

This makes future integrations easier because real external workflows also run as step-based jobs.

## What does the logger do?

The logger records important actions in a structured way, such as:

- content generated
- approval/rejection decisions
- publishing attempts
- job started / job completed

Right now logs go to the browser console.  
Later they can be sent to a monitoring or audit tool.

## Why this setup helps the business

- You get a stable, easy interface now.
- You can test workflows safely without publishing anything live.
- As integrations are added, the owner experience stays familiar.
- Technical upgrades happen behind the scenes, not by rebuilding every page.
