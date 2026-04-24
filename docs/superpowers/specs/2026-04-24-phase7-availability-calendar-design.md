# Phase 7: Availability Blocks + Calendar View — Design

## Decisions

- **Public form date picker:** Replace native `<input type="date">` with `react-day-picker` v9. Blocked dates passed as `disabled` prop — greyed out and unclickable.
- **Blocked dates source for public form:** `GET /api/blocked-dates` fetched on page load, returns `string[]` of ISO date strings.
- **Admin calendar:** Combined view at `/admin/calendar` — one calendar shows confirmed gig dates (dark filled) and blocked dates (dashed). Click to toggle blocks. Can't block a gig date.
- **Block toggle:** Server action `toggleBlock(date: string)` — if `AvailabilityBlock` exists for that date, delete it; otherwise create it. No `reason` field in v1 (YAGNI).

## File Structure

```
src/
  app/
    api/
      blocked-dates/
        route.ts          ← GET: return all AvailabilityBlock dates as ISO strings
    admin/
      calendar/
        page.tsx          ← Server component: fetch gigs + blocked dates, render AdminCalendar
        actions.ts        ← toggleBlock(date: string) server action
  components/
    admin/
      AdminCalendar.tsx   ← 'use client': month calendar with gig/blocked markers + toggle
      AdminNav.tsx        ← Add "Calendar" link (modify)
    BookingFormStep3.tsx  ← Replace <input type="date"> with react-day-picker (modify)
```

## Data Flow

### Public form
1. `BookingFormStep3` mounts → `fetch('/api/blocked-dates')` → receives `string[]`
2. Dates passed to `DayPicker` as `disabled={[...blockedDates.map(d => new Date(d)), { before: new Date() }]}`
3. User picks dates → valid ISO strings stored in RHF → submitted to `/api/bookings` as before

### Admin calendar
1. `/admin/calendar` server component fetches:
   - `db.request.findMany({ where: { status: 'approved' }, select: { dates: true } })` → extract all gig dates
   - `db.availabilityBlock.findMany()` → all blocked dates
2. Both serialized to ISO strings, passed to `AdminCalendar`
3. User clicks a date → `toggleBlock(isoDate)` → create or delete `AvailabilityBlock` → `revalidatePath('/admin/calendar')`

## Components

### `AdminCalendar`
- Props: `gigDates: string[]`, `blockedDates: string[]`
- State: current month (prev/next nav)
- Renders a 7×6 grid manually with Tailwind (no calendar library needed on admin side — simpler than importing react-day-picker twice)
- Date styling:
  - Gig date: `bg-[#1a1a1a] text-[#faf7f2] rounded-full`
  - Blocked date: `border border-dashed border-[#9a7a5a] rounded-full text-[#9a7a5a]`
  - Both (gig + blocked): show gig styling (gig takes priority, can't block)
  - Today: `font-bold`
  - Other: hover shows pointer if not a gig date
- Click handler: if gig date → no-op; else → call `toggleBlock(isoDate)`

### `BookingFormStep3` changes
- Import `DayPicker` from `react-day-picker` and its CSS
- Replace the date count / `<input type="date">` pattern with a `DayPicker` in `mode="multiple"` (max 5 selected) or `mode="single"` when `!isMultiDate`
- Store selected dates in RHF as ISO string array (same format as before)
- Pass `disabled` array combining blocked dates + `{ before: new Date() }`

## API Route

`GET /api/blocked-dates` — no auth required (public form needs it):
```ts
return Response.json(blocks.map(b => b.date.toISOString()))
```

## Dependency

`react-day-picker` v9 — used only in `BookingFormStep3` on the client.

## AdminNav Addition

Add "Calendar" link between "Confirmed Gigs" and "Sign out":
```tsx
<Link href="/admin/calendar">Calendar</Link>
```

## Out of Scope

- Block reason / notes (YAGNI for v1)
- Recurring availability patterns
- Time-based blocks (date-level only)
- Showing blocked dates on admin gigs page
