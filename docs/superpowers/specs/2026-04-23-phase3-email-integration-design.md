# Phase 3: Email Integration — Design

## Decisions

- **Email provider:** Resend (spec already committed)
- **Failure behavior:** Fire-and-forget with logging. DB write is authoritative. Email failures log via `console.error` and never block the 201 response.
- **Sending domain:** `onboarding@resend.dev` via `RESEND_FROM_EMAIL` env var. Swappable to a verified custom domain later with a one-line `.env` change.
- **Reply-to:** `OWNER_EMAIL` on confirmation emails so requesters can reply directly to Vinh's inbox.
- **Templates:** Inline HTML template literals with minimal inline styles matching the warm/editorial palette. No React Email, no mjml — keeps deps tight.

## New env var

Add `RESEND_FROM_EMAIL` to `.env.example` and `.env` (default: `onboarding@resend.dev`).

## File Structure

```
src/
  lib/
    email.ts            ← Resend singleton, sendConfirmation, sendOwnerNotification
  app/
    api/
      bookings/
        route.ts        ← modify to fire both emails after DB write
```

## Architecture

`src/lib/email.ts` exports:
- A Resend client singleton (instantiated once from `RESEND_API_KEY`)
- `sendConfirmation(data: BookingFormData): Promise<void>` — to the requester
- `sendOwnerNotification(data: BookingFormData): Promise<void>` — to `OWNER_EMAIL`

Both functions:
- Build HTML content from template literal
- Call `resend.emails.send(...)`
- On failure: `console.error('[email] ...', err)` — do not throw

In `route.ts`, after the successful `db.request.create`:
```ts
sendConfirmation(data).catch(err => console.error('[email] confirmation failed:', err))
sendOwnerNotification(data).catch(err => console.error('[email] owner notify failed:', err))
return Response.json({ success: true }, { status: 201 })
```

No `await` — promises run in background. Response returns immediately.

## Email Content

### Confirmation (to requester)
- **Subject:** `Got your booking request — I'll be in touch`
- **Body:** "Thanks [name] — I got your request for [service]. I'll respond within 3 days." + summary table of service, date(s), location.

### Owner notification (to `OWNER_EMAIL`)
- **Subject:** `New booking request from [name]`
- **Body:** Full field dump (all non-null fields) in a table, with dates formatted cleanly. Admin link stub (`/admin`) in footer — not clickable yet since admin isn't built (Phase 4).

## Out of scope

- Retry logic on email failure (YAGNI — console log is enough for v1)
- Email templates as separate files / React Email (adds deps for no current win)
- Unsubscribe links (transactional emails, not marketing — not required)
- Approval/decline/needs-info templates (Phase 5 when admin actions land)
