# Phase 6: Confirmed Gigs View — Design

## Decisions

- **Route:** `/admin/gigs` — new page linked from admin nav
- **Editing:** Inline on each card (all post-approval fields always visible and editable)
- **Filters:** Client-side toggle in React state (Upcoming / Past / Unpaid) — no URL params, no server round-trips
- **Save:** Single "Save" button per card calls a server action, revalidates `/admin/gigs`

## File Structure

```
src/
  app/
    admin/
      gigs/
        page.tsx        ← Server component: fetches approved gigs, renders GigList
        actions.ts      ← updateGig(id, data) server action
  components/
    admin/
      GigList.tsx       ← 'use client': owns filter state, renders GigCard list
      GigCard.tsx       ← 'use client': inline editing of post-approval fields
```

## Data Flow

1. `GET /admin/gigs` → server component fetches `db.request.findMany({ where: { status: 'approved' } })`
2. Serializes Dates to ISO strings, passes to `<GigList>`
3. `GigList` applies active filter (Upcoming / Past / Unpaid) client-side
4. Each `GigCard` has local state for the editable fields, pre-filled from props
5. User edits fields → clicks Save → `updateGig(id, data)` server action → `revalidatePath('/admin/gigs')`

## Serialized Gig Type

```ts
type SerializedGig = {
  id: string
  name: string
  bandName: string | null
  service: string
  serviceOther: string | null
  dates: string[]          // ISO strings
  location: string | null
  // Post-approval fields
  finalPay: string | null  // Decimal serialized as string
  callTime: string | null
  loadInTime: string | null
  isPaid: boolean
  postGigNotes: string | null
}
```

## GigCard Inline Fields

| Field | Input | Condition |
|---|---|---|
| Final pay | `<input type="number">` with $ prefix | Always |
| Call time | `<input type="text">` (e.g. "5:00 PM") | Always |
| Load-in time | `<input type="text">` | Only when `service === 'live_show'` |
| Paid toggle | `<input type="checkbox">` | Always |
| Post-gig notes | `<textarea>` | Always |

## Filter Logic

- **Upcoming** — `dates.some(d => new Date(d) > new Date())`
- **Past** — `dates.every(d => new Date(d) < new Date())`
- **Unpaid** — `isPaid === false`
- Default: All (no filter)

## updateGig Action

Accepts `(id: string, data: { finalPay: string | null, callTime: string | null, loadInTime: string | null, isPaid: boolean, postGigNotes: string | null })`. Writes to DB with Prisma. `finalPay` converted from string to `Decimal` via Prisma (pass as string directly — Prisma accepts it). Calls `revalidatePath('/admin/gigs')`.

## Nav

Add a shared admin header (or simple nav links) on both `/admin` and `/admin/gigs`:
- "Pending Requests" → `/admin`
- "Confirmed Gigs" → `/admin/gigs`

## Out of Scope

- ICS download button (Phase 8)
- Calendar view (Phase 7)
- Sorting gigs by date
