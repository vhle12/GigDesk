# Phase 2: Public Booking Form — Design

## Decisions

- **Aesthetic:** Warm & Editorial — off-white (`#faf7f2`) background, warm brown accents (`#9a7a5a`), dark charcoal text (`#1a1a1a`), cream borders (`#e8e0d5`)
- **Form layout:** Step-by-step wizard (3 steps), single RHF instance across all steps
- **Bio section:** Fleshed-out placeholder — headline, 2-3 sentence bio stub, 3 audio/video embed placeholders

## File Structure

```
src/
  app/
    book/
      page.tsx
    api/
      bookings/
        route.ts
  components/
    BookingForm.tsx
    BookingFormStep1.tsx
    BookingFormStep2.tsx
    BookingFormStep3.tsx
  lib/
    db.ts
    validations/
      booking.ts
```

## Architecture

- `page.tsx` — server component, renders bio + `<BookingForm />`
- `BookingForm.tsx` — `"use client"`, owns all RHF state, renders active step, handles submit
- Step components receive `control` and `errors` from parent via props
- Per-step validation via `form.trigger([...fieldNames])` on Next click
- Final submit POSTs to `/api/bookings`
- API route re-validates with Zod, writes to `Request` table via Prisma, returns 201
- Honeypot: hidden `<input name="website" />`, silent 200 rejection if non-empty

## Zod Schema (booking.ts)

Mirrors the `Request` model: all fields from spec, string enums for `service`, `preferredNotify`, `budgetRange`, `status`. `dates` is `z.array(z.string())` (ISO strings from date inputs, coerced to DateTime in API).

## Step Breakdown

| Step | Fields |
|------|--------|
| 1 Contact | name, email, phone, preferredNotify, bandName, role |
| 2 Service | service, serviceOther (conditional) |
| 3 Details | isMultiDate, dates (1–5), startTime, duration, location, genre, referenceLink, budgetRange, notes |

## Out of Scope for Phase 2

- Real email sending (Phase 3)
- Blocked date greying (Phase 7)
- Any admin UI
