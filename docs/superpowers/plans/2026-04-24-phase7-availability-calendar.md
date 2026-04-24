# Phase 7: Availability Blocks + Calendar View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/admin/calendar` page where clicking dates blocks/unblocks them, and update the public booking form to use react-day-picker with blocked dates greyed out.

**Architecture:** `GET /api/blocked-dates` returns blocked dates as YYYY-MM-DD strings for the public form. Admin calendar is a custom Tailwind grid (`AdminCalendar`) — clicking a date calls `toggleBlock` server action. `BookingFormStep3` replaces native date inputs with react-day-picker v9 in single or multiple mode, fetching blocked dates on mount.

**Tech Stack:** Next.js 16 App Router, Prisma 7, react-day-picker v9, TypeScript strict, Tailwind warm/editorial palette

---

## File Map

| File | Role |
|------|------|
| `src/app/api/blocked-dates/route.ts` | GET — public endpoint returning blocked dates as YYYY-MM-DD strings |
| `src/app/admin/calendar/actions.ts` | `toggleBlock(dateStr)` server action |
| `src/components/admin/AdminCalendar.tsx` | `'use client'` — custom month grid, gig+block markers, click to toggle |
| `src/app/admin/calendar/page.tsx` | Async server component — fetch gigs + blocked dates, render AdminCalendar |
| `src/components/admin/AdminNav.tsx` | Add "Calendar" link (modify) |
| `src/components/BookingFormStep3.tsx` | Replace native date inputs with react-day-picker (modify) |

---

### Task 1: `GET /api/blocked-dates` route

**Files:**
- Create: `src/app/api/blocked-dates/route.ts`

- [ ] **Step 1: Create the file**

```ts
import { db } from '@/lib/db'

export async function GET() {
  const blocks = await db.availabilityBlock.findMany({
    select: { date: true },
    orderBy: { date: 'asc' },
  })
  // Return YYYY-MM-DD strings — avoids timezone issues in the browser
  return Response.json(
    blocks.map(b => b.date.toISOString().split('T')[0]),
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
git add src/app/api/blocked-dates/route.ts
git commit -m "feat: add GET /api/blocked-dates public endpoint"
```

---

### Task 2: `toggleBlock` server action

**Files:**
- Create: `src/app/admin/calendar/actions.ts`

- [ ] **Step 1: Create the file**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function toggleBlock(
  dateStr: string,
): Promise<{ error?: string }> {
  try {
    // dateStr is YYYY-MM-DD — parse to midnight UTC
    const date = new Date(dateStr + 'T00:00:00.000Z')

    const existing = await db.availabilityBlock.findUnique({
      where: { date },
    })

    if (existing) {
      await db.availabilityBlock.delete({ where: { date } })
    } else {
      await db.availabilityBlock.create({ data: { date } })
    }

    revalidatePath('/admin/calendar')
    return {}
  } catch (err) {
    console.error('[actions] toggleBlock failed:', err)
    return { error: 'Failed to update availability' }
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
git add src/app/admin/calendar/actions.ts
git commit -m "feat: add toggleBlock server action for availability blocks"
```

---

### Task 3: `AdminCalendar` component

**Files:**
- Create: `src/components/admin/AdminCalendar.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { toggleBlock } from '@/app/admin/calendar/actions'

type Props = {
  gigDates: string[]      // YYYY-MM-DD strings
  blockedDates: string[]  // YYYY-MM-DD strings
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function AdminCalendar({ gigDates, blockedDates }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [pending, setPending] = useState<string | null>(null)
  const [localBlocked, setLocalBlocked] = useState<string[]>(blockedDates)

  const gigSet = new Set(gigDates)
  const blockedSet = new Set(localBlocked)

  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const handleDayClick = async (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (gigSet.has(dateStr)) return // can't block a gig date
    if (pending) return

    setPending(dateStr)
    // Optimistic update
    if (blockedSet.has(dateStr)) {
      setLocalBlocked(prev => prev.filter(d => d !== dateStr))
    } else {
      setLocalBlocked(prev => [...prev, dateStr])
    }

    const result = await toggleBlock(dateStr)
    if (result.error) {
      // Revert on error
      setLocalBlocked(blockedDates)
    }
    setPending(null)
  }

  // Build 6-row × 7-col grid cells (42 cells)
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - startOffset + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  const todayStr = toYMD(today)

  return (
    <div className="w-full max-w-md">
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded px-3 py-1 text-sm text-[#9a7a5a] hover:bg-[#f0ebe3]"
        >
          ←
        </button>
        <h2 className="text-base font-semibold text-[#1a1a1a]">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="rounded px-3 py-1 text-sm text-[#9a7a5a] hover:bg-[#f0ebe3]"
        >
          →
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAYS.map(d => (
          <div key={d} className="py-1 text-[10px] font-medium text-[#b0a090]">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isGig = gigSet.has(dateStr)
          const isBlocked = new Set(localBlocked).has(dateStr)
          const isToday = dateStr === todayStr
          const isPending = pending === dateStr

          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              disabled={isPending}
              title={isGig ? 'Confirmed gig' : isBlocked ? 'Blocked — click to unblock' : 'Click to block'}
              className={[
                'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors',
                isGig
                  ? 'bg-[#1a1a1a] text-[#faf7f2] cursor-default'
                  : isBlocked
                    ? 'border border-dashed border-[#9a7a5a] text-[#9a7a5a] hover:bg-[#f0ebe3]'
                    : isToday
                      ? 'font-bold text-[#1a1a1a] hover:bg-[#f0ebe3] cursor-pointer'
                      : 'text-[#555] hover:bg-[#f0ebe3] cursor-pointer',
                isPending ? 'opacity-50' : '',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-[11px] text-[#888]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-4 w-4 rounded-full bg-[#1a1a1a]" />
          Confirmed gig
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-4 w-4 rounded-full border border-dashed border-[#9a7a5a]" />
          Blocked
        </span>
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
git add src/components/admin/AdminCalendar.tsx
git commit -m "feat: add AdminCalendar component with gig/block markers and toggle"
```

---

### Task 4: `/admin/calendar` page + update `AdminNav`

**Files:**
- Create: `src/app/admin/calendar/page.tsx`
- Modify: `src/components/admin/AdminNav.tsx`

- [ ] **Step 1: Create `src/app/admin/calendar/page.tsx`**

```tsx
import { db } from '@/lib/db'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminCalendar } from '@/components/admin/AdminCalendar'

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default async function CalendarPage() {
  const [gigRequests, blocks] = await Promise.all([
    db.request.findMany({
      where: { status: 'approved' },
      select: { dates: true },
    }),
    db.availabilityBlock.findMany({
      select: { date: true },
      orderBy: { date: 'asc' },
    }),
  ])

  // Flatten all confirmed gig dates to YYYY-MM-DD
  const gigDates = [
    ...new Set(gigRequests.flatMap(r => r.dates.map(toYMD))),
  ]
  const blockedDates = blocks.map(b => toYMD(b.date))

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <AdminNav />
        <h1 className="mb-2 text-3xl font-bold text-[#1a1a1a]">Calendar</h1>
        <p className="mb-8 text-sm text-[#888]">
          Click any open date to block it. Click a blocked date to unblock.
        </p>
        <AdminCalendar gigDates={gigDates} blockedDates={blockedDates} />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Read and update `src/components/admin/AdminNav.tsx`**

Read the current file, then add a "Calendar" link between "Confirmed Gigs" and the closing `</nav>` tag:

```tsx
<Link
  href="/admin/calendar"
  className="text-sm font-semibold text-[#1a1a1a] hover:text-[#9a7a5a]"
>
  Calendar
</Link>
```

The `nav` section should have three links in order: Pending Requests → Confirmed Gigs → Calendar.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/calendar/page.tsx src/components/admin/AdminNav.tsx
git commit -m "feat: add /admin/calendar page and Calendar nav link"
```

---

### Task 5: Update `BookingFormStep3` with react-day-picker

**Files:**
- Modify: `src/components/BookingFormStep3.tsx`

- [ ] **Step 1: Replace the entire file contents**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { UseFormReturn } from 'react-hook-form'
import { BookingFormData } from '@/lib/validations/booking'

type Props = {
  form: UseFormReturn<BookingFormData>
}

const inputClass =
  'w-full rounded border border-[#ddd6cc] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#b0a090] focus:border-[#9a7a5a] focus:outline-none'
const labelClass =
  'block text-[10px] uppercase tracking-widest text-[#9a7a5a] mb-1'
const errorClass = 'mt-1 text-xs text-red-600'

const BUDGET_OPTIONS = [
  { value: '100-250', label: '$100–250' },
  { value: '250-500', label: '$250–500' },
  { value: '500-1000', label: '$500–1,000' },
  { value: '1000+', label: '$1,000+' },
  { value: 'discuss', label: "Let's discuss" },
]

export function BookingFormStep3({ form }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form

  const isMultiDate = watch('isMultiDate')

  // Selected dates as Date objects (synced to RHF string array)
  const [selected, setSelected] = useState<Date[]>([])
  // Blocked dates fetched from API
  const [blockedDates, setBlockedDates] = useState<Date[]>([])

  // Fetch blocked dates once on mount
  useEffect(() => {
    fetch('/api/blocked-dates')
      .then(r => r.json())
      .then((dates: string[]) =>
        setBlockedDates(dates.map(d => new Date(d + 'T00:00:00.000Z'))),
      )
      .catch(() => {}) // non-critical — fail silently
  }, [])

  // Sync selected dates to RHF 'dates' field as YYYY-MM-DD strings
  const syncToForm = (dates: Date[]) => {
    setValue(
      'dates',
      dates.map(d => d.toISOString().split('T')[0]),
      { shouldValidate: true },
    )
  }

  const disabled = [{ before: new Date() }, ...blockedDates]

  const handleSingleSelect = (date: Date | undefined) => {
    const next = date ? [date] : []
    setSelected(next)
    syncToForm(next)
  }

  const handleMultiSelect = (dates: Date[] | undefined) => {
    const next = dates ?? []
    setSelected(next)
    syncToForm(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <input
          {...register('isMultiDate')}
          type="checkbox"
          id="isMultiDate"
          className="h-4 w-4 accent-[#9a7a5a]"
          onChange={e => {
            setValue('isMultiDate', e.target.checked)
            // Reset selection when toggling mode
            setSelected([])
            syncToForm([])
          }}
        />
        <label htmlFor="isMultiDate" className="text-sm text-[#555]">
          This is for multiple dates
        </label>
      </div>

      <div>
        <label className={labelClass}>
          {isMultiDate ? 'Dates *' : 'Date *'}
        </label>
        <div className="rounded border border-[#e8e0d5] bg-white p-2">
          {isMultiDate ? (
            <DayPicker
              mode="multiple"
              selected={selected}
              onSelect={handleMultiSelect}
              disabled={disabled}
              max={5}
            />
          ) : (
            <DayPicker
              mode="single"
              selected={selected[0]}
              onSelect={handleSingleSelect}
              disabled={disabled}
            />
          )}
        </div>
        {selected.length === 0 && errors.dates && (
          <p className={errorClass}>
            {(errors.dates as { message?: string }).message ?? 'Please select a date'}
          </p>
        )}
        {isMultiDate && selected.length > 0 && (
          <p className="mt-1 text-xs text-[#9a7a5a]">
            {selected.length} date{selected.length > 1 ? 's' : ''} selected (max 5)
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start time</label>
          <input
            {...register('startTime')}
            type="time"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Estimated duration</label>
          <input
            {...register('duration')}
            className={inputClass}
            placeholder="e.g. 3 hours"
          />
        </div>

        <div>
          <label className={labelClass}>Location / venue</label>
          <input
            {...register('location')}
            className={inputClass}
            placeholder="Or 'remote' for mixing"
          />
        </div>

        <div>
          <label className={labelClass}>Genre / style</label>
          <input
            {...register('genre')}
            className={inputClass}
            placeholder="e.g. Indie folk"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Reference tracks or links</label>
        <input
          {...register('referenceLink')}
          className={inputClass}
          placeholder="https://…"
        />
        {errors.referenceLink && (
          <p className={errorClass}>{errors.referenceLink.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Budget range</label>
        <select {...register('budgetRange')} className={inputClass}>
          <option value="">Select…</option>
          {BUDGET_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Additional notes</label>
        <textarea
          {...register('notes')}
          rows={4}
          className={inputClass}
          placeholder="Anything else I should know…"
        />
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
git add src/components/BookingFormStep3.tsx
git commit -m "feat: replace native date inputs with react-day-picker (blocked dates disabled)"
```

---

### Task 6: Build, verify, and push

- [ ] **Step 1: Run full build**

```bash
cd /Users/vinh/Development/GigDesk && npm run build 2>&1 | tail -20
```

Expected: clean build. Routes include:
```
○ /admin/calendar
ƒ /api/blocked-dates
```

- [ ] **Step 2: Run lint**

```bash
cd /Users/vinh/Development/GigDesk && npm run lint 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Verify happy path**

Start `npm run dev`.

**Admin calendar:**
1. Go to `/admin/calendar` — should see current month with nav arrows
2. Confirmed gig dates (from `/admin/gigs`) show as dark circles
3. Click an open date → it gains a dashed border (blocked). Reload to confirm it persists.
4. Click the blocked date → it returns to normal (unblocked). Reload to confirm.
5. Clicking a confirmed gig date does nothing.

**Public booking form:**
1. Go to `http://localhost:3000/book`, advance to step 3
2. A calendar picker appears instead of native date inputs
3. Past dates are greyed out / unclickable
4. Dates you blocked in step above are also greyed out
5. Select a valid date → it highlights
6. Toggle "multiple dates" → picker switches to multi-select mode (max 5)
7. Submit a complete booking — check Prisma Studio to confirm dates saved correctly

- [ ] **Step 4: Push**

```bash
git add package.json package-lock.json && git push origin main
```
