# Phase 6: Confirmed Gigs View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin/gigs` confirmed gigs page with inline editing of post-approval fields, client-side filters, and a shared admin nav on both admin pages.

**Architecture:** Server component at `/admin/gigs` fetches approved requests, serializes Prisma Decimal as string, passes to `'use client'` `GigList` which owns filter state and renders `GigCard` components with inline editable fields. A shared `AdminNav` server component replaces the inline header on both `/admin` and `/admin/gigs`.

**Tech Stack:** Next.js 16 App Router, Prisma 7, TypeScript strict, Tailwind (warm/editorial: bg #faf7f2, accent #9a7a5a, surface #f0ebe3, border #e8e0d5)

---

## File Map

| File | Role |
|------|------|
| `src/components/admin/AdminNav.tsx` | Server component — nav links + sign out button, used on both admin pages |
| `src/app/admin/gigs/actions.ts` | `updateGig` server action |
| `src/components/admin/GigCard.tsx` | `'use client'` — inline-editable post-approval fields, defines `SerializedGig` type |
| `src/components/admin/GigList.tsx` | `'use client'` — filter state (all/upcoming/past/unpaid), renders GigCard list |
| `src/app/admin/gigs/page.tsx` | Async server component — fetch approved gigs, render GigList |
| `src/app/admin/page.tsx` | Modify — replace inline header with `<AdminNav />` |

---

### Task 1: `AdminNav` component + update `/admin` page

**Files:**
- Create: `src/components/admin/AdminNav.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Create `src/components/admin/AdminNav.tsx`**

```tsx
import Link from 'next/link'
import { logout } from '@/app/admin/actions'

export function AdminNav() {
  return (
    <div className="mb-8 flex items-center justify-between">
      <nav className="flex gap-6">
        <Link
          href="/admin"
          className="text-sm font-semibold text-[#1a1a1a] hover:text-[#9a7a5a]"
        >
          Pending Requests
        </Link>
        <Link
          href="/admin/gigs"
          className="text-sm font-semibold text-[#1a1a1a] hover:text-[#9a7a5a]"
        >
          Confirmed Gigs
        </Link>
      </nav>
      <form action={logout}>
        <button
          type="submit"
          className="text-xs text-[#9a7a5a] underline underline-offset-2 hover:text-[#1a1a1a]"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/app/admin/page.tsx`**

Replace the entire file content:

```tsx
import { db } from '@/lib/db'
import { RequestCard, type SerializedRequest } from '@/components/admin/RequestCard'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminPage() {
  const requests = await db.request.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      service: true,
      serviceOther: true,
      dates: true,
      location: true,
      budgetRange: true,
      notes: true,
      createdAt: true,
      bandName: true,
    },
  })

  const serialized: SerializedRequest[] = requests.map(r => ({
    ...r,
    dates: r.dates.map(d => d.toISOString()),
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <AdminNav />
        <h1 className="mb-8 text-3xl font-bold text-[#1a1a1a]">
          Pending Requests
          {serialized.length > 0 && (
            <span className="ml-3 text-xl font-normal text-[#9a7a5a]">
              ({serialized.length})
            </span>
          )}
        </h1>

        {serialized.length === 0 ? (
          <p className="text-sm text-[#888]">No pending requests — you&apos;re all caught up.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {serialized.map(req => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AdminNav.tsx src/app/admin/page.tsx
git commit -m "feat: add AdminNav component, wire into /admin page"
```

---

### Task 2: `updateGig` server action

**Files:**
- Create: `src/app/admin/gigs/actions.ts`

- [ ] **Step 1: Create the file**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

type UpdateGigData = {
  finalPay: string | null
  callTime: string | null
  loadInTime: string | null
  isPaid: boolean
  postGigNotes: string | null
}

export async function updateGig(
  id: string,
  data: UpdateGigData,
): Promise<{ error?: string }> {
  try {
    await db.request.update({
      where: { id },
      data: {
        finalPay: data.finalPay ?? null,
        callTime: data.callTime,
        loadInTime: data.loadInTime,
        isPaid: data.isPaid,
        postGigNotes: data.postGigNotes,
      },
    })
    revalidatePath('/admin/gigs')
    return {}
  } catch (err) {
    console.error('[actions] updateGig failed:', err)
    return { error: 'Failed to save changes' }
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/gigs/actions.ts
git commit -m "feat: add updateGig server action for post-approval fields"
```

---

### Task 3: `GigCard` component

**Files:**
- Create: `src/components/admin/GigCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { updateGig } from '@/app/admin/gigs/actions'

export type SerializedGig = {
  id: string
  name: string
  bandName: string | null
  service: string
  serviceOther: string | null
  dates: string[]
  location: string | null
  finalPay: string | null
  callTime: string | null
  loadInTime: string | null
  isPaid: boolean
  postGigNotes: string | null
}

const SERVICE_LABELS: Record<string, string> = {
  live_show: 'Live show',
  session: 'Session recording',
  mix_master: 'Mixing / mastering',
  other: 'Other',
}

const inputClass =
  'w-full rounded border border-[#ddd6cc] bg-[#faf7f2] px-2 py-1 text-sm text-[#1a1a1a] focus:border-[#9a7a5a] focus:outline-none'
const labelClass = 'block text-[10px] uppercase tracking-widest text-[#9a7a5a] mb-1'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function GigCard({ gig }: { gig: SerializedGig }) {
  const [finalPay, setFinalPay] = useState(gig.finalPay ?? '')
  const [callTime, setCallTime] = useState(gig.callTime ?? '')
  const [loadInTime, setLoadInTime] = useState(gig.loadInTime ?? '')
  const [isPaid, setIsPaid] = useState(gig.isPaid)
  const [postGigNotes, setPostGigNotes] = useState(gig.postGigNotes ?? '')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const serviceLabel =
    gig.service === 'other' && gig.serviceOther
      ? gig.serviceOther
      : (SERVICE_LABELS[gig.service] ?? gig.service)

  const dateStr =
    gig.dates.length === 1
      ? formatDate(gig.dates[0])
      : gig.dates.map(formatDate).join(', ')

  const handleSave = async () => {
    setPending(true)
    setSaved(false)
    setError(null)
    try {
      const result = await updateGig(gig.id, {
        finalPay: finalPay.trim() || null,
        callTime: callTime.trim() || null,
        loadInTime: loadInTime.trim() || null,
        isPaid,
        postGigNotes: postGigNotes.trim() || null,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded border border-[#e8e0d5] bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-bold text-[#1a1a1a]">
            {gig.name}
            {gig.bandName && (
              <span className="ml-2 text-sm font-normal text-[#9a7a5a]">
                · {gig.bandName}
              </span>
            )}
          </h3>
          <p className="text-[11px] text-[#9a7a5a]">
            {serviceLabel} · {dateStr}
            {gig.location && ` · ${gig.location}`}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isPaid
              ? 'bg-[#e8f5e9] text-[#2e7d32]'
              : 'bg-[#fff3e0] text-[#e65100]'
          }`}
        >
          {isPaid ? 'Paid' : 'Unpaid'}
        </span>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>Final pay ($)</label>
          <input
            value={finalPay}
            onChange={e => setFinalPay(e.target.value)}
            placeholder="e.g. 400"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Call time</label>
          <input
            value={callTime}
            onChange={e => setCallTime(e.target.value)}
            placeholder="e.g. 5:00 PM"
            className={inputClass}
          />
        </div>

        {gig.service === 'live_show' && (
          <div>
            <label className={labelClass}>Load-in time</label>
            <input
              value={loadInTime}
              onChange={e => setLoadInTime(e.target.value)}
              placeholder="e.g. 4:00 PM"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className={labelClass}>Post-gig notes</label>
        <textarea
          value={postGigNotes}
          onChange={e => setPostGigNotes(e.target.value)}
          rows={2}
          placeholder="Any notes after the gig…"
          className={inputClass}
        />
      </div>

      {/* Paid toggle + Save */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#555]">
          <input
            type="checkbox"
            checked={isPaid}
            onChange={e => setIsPaid(e.target.checked)}
            className="h-4 w-4 accent-[#9a7a5a]"
          />
          Mark as paid
        </label>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs text-[#2e7d32]">Saved ✓</span>
          )}
          {error && (
            <span className="text-xs text-red-600">{error}</span>
          )}
          <button
            onClick={handleSave}
            disabled={pending}
            className="rounded bg-[#1a1a1a] px-4 py-1.5 text-xs font-semibold text-[#faf7f2] hover:bg-[#333] disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/GigCard.tsx
git commit -m "feat: add GigCard with inline post-approval field editing"
```

---

### Task 4: `GigList` component

**Files:**
- Create: `src/components/admin/GigList.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { GigCard, type SerializedGig } from './GigCard'

type Filter = 'all' | 'upcoming' | 'past' | 'unpaid'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'unpaid', label: 'Unpaid' },
]

function applyFilter(gigs: SerializedGig[], filter: Filter): SerializedGig[] {
  const now = new Date()
  switch (filter) {
    case 'upcoming':
      return gigs.filter(g => g.dates.some(d => new Date(d) > now))
    case 'past':
      return gigs.filter(g => g.dates.every(d => new Date(d) < now))
    case 'unpaid':
      return gigs.filter(g => !g.isPaid)
    default:
      return gigs
  }
}

export function GigList({ gigs }: { gigs: SerializedGig[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = applyFilter(gigs, filter)

  return (
    <div>
      {/* Filter buttons */}
      <div className="mb-6 flex gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#1a1a1a] text-[#faf7f2]'
                : 'bg-[#f0ebe3] text-[#9a7a5a] hover:bg-[#e8e0d5]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#888]">No gigs match this filter.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(g => (
            <GigCard key={g.id} gig={g} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/GigList.tsx
git commit -m "feat: add GigList with upcoming/past/unpaid client-side filters"
```

---

### Task 5: `/admin/gigs` page

**Files:**
- Create: `src/app/admin/gigs/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { db } from '@/lib/db'
import { AdminNav } from '@/components/admin/AdminNav'
import { GigList } from '@/components/admin/GigList'
import type { SerializedGig } from '@/components/admin/GigCard'

export default async function GigsPage() {
  const gigs = await db.request.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      bandName: true,
      service: true,
      serviceOther: true,
      dates: true,
      location: true,
      finalPay: true,
      callTime: true,
      loadInTime: true,
      isPaid: true,
      postGigNotes: true,
    },
  })

  const serialized: SerializedGig[] = gigs.map(g => ({
    ...g,
    dates: g.dates.map(d => d.toISOString()),
    finalPay: g.finalPay?.toString() ?? null,
  }))

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <AdminNav />
        <h1 className="mb-8 text-3xl font-bold text-[#1a1a1a]">
          Confirmed Gigs
          {serialized.length > 0 && (
            <span className="ml-3 text-xl font-normal text-[#9a7a5a]">
              ({serialized.length})
            </span>
          )}
        </h1>

        {serialized.length === 0 ? (
          <p className="text-sm text-[#888]">No confirmed gigs yet.</p>
        ) : (
          <GigList gigs={serialized} />
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/gigs/page.tsx
git commit -m "feat: add /admin/gigs confirmed gigs page"
```

---

### Task 6: Build, verify, and push

- [ ] **Step 1: Full build**

```bash
cd /Users/vinh/Development/GigDesk && npm run build 2>&1 | tail -20
```

Expected: clean build, routes include:
```
○ /admin
○ /admin/gigs
○ /admin/login
ƒ /api/bookings
○ /book
```

- [ ] **Step 2: Lint**

```bash
cd /Users/vinh/Development/GigDesk && npm run lint 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Verify the happy path**

Start `npm run dev`. Test:
1. Go to `/admin` — should see nav with "Pending Requests" and "Confirmed Gigs" links
2. Click "Confirmed Gigs" — `/admin/gigs` loads (empty state if no approved gigs)
3. Approve a booking from `/admin` (submit a test booking first at `/book` if needed)
4. Return to `/admin/gigs` — the approved gig card appears
5. Fill in Final pay, Call time, toggle Paid → click Save → "Saved ✓" appears
6. Reload the page — saved values persist
7. Filter buttons: Upcoming, Past, Unpaid all filter correctly
8. For a `live_show` gig — Load-in time field appears; for other services, it's hidden
9. Sign out works from both `/admin` and `/admin/gigs`

- [ ] **Step 4: Push**

```bash
git push origin main
```
