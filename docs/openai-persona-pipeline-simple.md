# OpenAI Persona Images (Simple Guide)

This update adds a new way to create persona reference images directly inside VB Jewelry AI Studio.

## What this does

When you open a persona, you can now click **Generate Reference Pack**.

Live generation can take around 1 to 3 minutes.

The system creates 4 images:
- Hero portrait
- 3/4 body shot
- Side profile
- Close-up jewelry-friendly shot

## Why this matters

These images help the AI keep the same persona look later.

That means future content can stay more visually consistent instead of changing face, angle, or styling too much between outputs.

## Approval flow

After images are generated, you can mark one or more as **Approved**.

Approved references become your trusted guide images for future generation steps.

## Is this live or mock?

This is OpenAI-first and runs server-side.

If image generation is unavailable (for example API/key issue), the app saves safe placeholder previews so your workflow does not break.

Fallback previews are clearly labeled as **Reference preview (fallback mode)**.

## What is saved

Each reference image is stored in the database with:
- Persona link
- Shot type
- Image URL
- Prompt used
- Provider used
- Approval status

This makes the persona reference pack reusable for future jewelry image and video workflows.
