# Phase 2: Public Booking Form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public `/book` page with a 3-step wizard booking form that saves requests to Postgres.

**Architecture:** Single React Hook Form instance spans all 3 steps; per-step validation fires on "Next" via `form.trigger()`. Final submit POSTs JSON to `/api/bookings`, which re-validates with Zod and writes to the `Request` table via Prisma 7's Neon adapter.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, Prisma 7 + `@prisma/adapter-neon`, React Hook Form 7.73, `@hookform/resolvers` 5.2 (Zod 4), `zod` 4.3

---

## File Map

| File | Role |
|------|------|
| `src/lib/db.ts` | Prisma singleton with Neon WebSocket adapter |
| `src/lib/validations/booking.ts` | Zod schema + inferred types (shared by form + API) |
| `src/app/api/bookings/route.ts` | POST handler — validate, write, return 201 |
| `src/components/BookingFormStep1.tsx` | Contact fields (name, email, phone, etc.) |
| `src/components/BookingFormStep2.tsx` | Service fields (dropdown + conditional text) |
| `src/components/BookingFormStep3.tsx` | Event detail fields (dates, budget, notes, etc.) |
| `src/components/BookingForm.tsx` | Wizard shell — step state, submit, success screen |
| `src/app/book/page.tsx` | `/book` route — bio + form, server component |
| `src/app/globals.css` | Warm/editorial palette CSS variables |
| `src/app/layout.tsx` | Update site metadata |

---

### Task 1: Prisma DB singleton

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Create `src/lib/db.ts`**

```ts
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'
import { PrismaClient } from '../generated/prisma'

// ws needed for Node.js < 22 (dev and Vercel functions below Node 22)
neonConfig.webSocketConstructor = ws

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaNeon(pool)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 2: Verify TypeScript accepts the file**

```bash
npx tsc --noEmit 2>&1 | grep db.ts
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts package.json package-lock.json
git commit -m "feat: add Prisma db singleton with Neon adapter"
```

---

### Task 2: Zod booking schema

**Files:**
- Create: `src/lib/validations/booking.ts`

- [ ] **Step 1: Create `src/lib/validations/booking.ts`**

```ts
import { z } from 'zod'

const optStr = z.string().transform(v => v.trim() || undefined).optional()

export const bookingSchema = z.object({
  // Contact
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: optStr,
  preferredNotify: z.enum(['email', 'phone']),
  bandName: optStr,
  role: optStr,

  // Service
  service: z.enum(['live_show', 'session', 'mix_master', 'other']),
  serviceOther: optStr,

  // Event
  isMultiDate: z.boolean().default(false),
  dates: z
    .array(z.string().min(1))
    .min(1, 'At least one date is required')
    .max(5),
  startTime: optStr,
  duration: optStr,
  location: optStr,
  genre: optStr,
  referenceLink: z
    .string()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal('')),
  budgetRange: z
    .enum(['100-250', '250-500', '500-1000', '1000+', 'discuss'])
    .optional(),
  notes: optStr,

  // Honeypot — must be empty
  website: z.string().max(0).optional(),
})

export type BookingFormData = z.infer<typeof bookingSchema>

// Field names per step — used for per-step validation in the wizard
export const STEP_FIELDS = {
  1: ['name', 'email', 'phone', 'preferredNotify', 'bandName', 'role'],
  2: ['service', 'serviceOther'],
  3: [
    'isMultiDate',
    'dates',
    'startTime',
    'duration',
    'location',
    'genre',
    'referenceLink',
    'budgetRange',
    'notes',
  ],
} as const satisfies Record<number, (keyof BookingFormData)[]>
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit 2>&1 | grep validations
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/booking.ts
git commit -m "feat: add Zod booking schema with step field map"
```

---

### Task 3: POST /api/bookings route

**Files:**
- Create: `src/app/api/bookings/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { bookingSchema } from '@/lib/validations/booking'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Honeypot check — silent 200 so bots think they succeeded
  if (body.website) {
    return Response.json({ success: true }, { status: 200 })
  }

  const result = bookingSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Invalid request', issues: result.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const data = result.data

  await db.request.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      preferredNotify: data.preferredNotify,
      bandName: data.bandName ?? null,
      role: data.role ?? null,
      service: data.service,
      serviceOther: data.serviceOther ?? null,
      isMultiDate: data.isMultiDate,
      dates: data.dates.map(d => new Date(d)),
      startTime: data.startTime ?? null,
      duration: data.duration ?? null,
      location: data.location ?? null,
      genre: data.genre ?? null,
      referenceLink: data.referenceLink || null,
      budgetRange: data.budgetRange ?? null,
      notes: data.notes ?? null,
      status: 'pending',
    },
  })

  return Response.json({ success: true }, { status: 201 })
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit 2>&1 | grep -E "api|route"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/route.ts
git commit -m "feat: add POST /api/bookings route"
```

---

### Task 4: BookingFormStep1 — Contact fields

**Files:**
- Create: `src/components/BookingFormStep1.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

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

export function BookingFormStep1({ form }: Props) {
  const { register, formState: { errors } } = form

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass}>Name *</label>
        <input
          {...register('name')}
          className={inputClass}
          placeholder="Your name"
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Email *</label>
        <input
          {...register('email')}
          type="email"
          className={inputClass}
          placeholder="you@example.com"
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Phone</label>
        <input
          {...register('phone')}
          type="tel"
          className={inputClass}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className={labelClass}>Preferred contact *</label>
        <select {...register('preferredNotify')} className={inputClass}>
          <option value="">Select…</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>
        {errors.preferredNotify && (
          <p className={errorClass}>{errors.preferredNotify.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Band / Project</label>
        <input
          {...register('bandName')}
          className={inputClass}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className={labelClass}>Your role</label>
        <input
          {...register('role')}
          className={inputClass}
          placeholder="e.g. Band leader, Producer"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit 2>&1 | grep BookingFormStep1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/BookingFormStep1.tsx
git commit -m "feat: add BookingFormStep1 (contact fields)"
```

---

### Task 5: BookingFormStep2 — Service fields

**Files:**
- Create: `src/components/BookingFormStep2.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

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

const SERVICE_LABELS: Record<string, string> = {
  live_show: 'Live show',
  session: 'Session recording',
  mix_master: 'Mixing / mastering',
  other: 'Other',
}

export function BookingFormStep2({ form }: Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = form

  const service = watch('service')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Service *</label>
        <select {...register('service')} className={inputClass}>
          <option value="">Select a service…</option>
          {Object.entries(SERVICE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.service && (
          <p className={errorClass}>{errors.service.message}</p>
        )}
      </div>

      {service === 'other' && (
        <div>
          <label className={labelClass}>Describe the service *</label>
          <input
            {...register('serviceOther')}
            className={inputClass}
            placeholder="Tell me more…"
          />
          {errors.serviceOther && (
            <p className={errorClass}>{errors.serviceOther.message}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit 2>&1 | grep BookingFormStep2
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/BookingFormStep2.tsx
git commit -m "feat: add BookingFormStep2 (service fields)"
```

---

### Task 6: BookingFormStep3 — Event detail fields

**Files:**
- Create: `src/components/BookingFormStep3.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
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
    formState: { errors },
  } = form

  const isMultiDate = watch('isMultiDate')
  const [dateCount, setDateCount] = useState(1)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <input
          {...register('isMultiDate')}
          type="checkbox"
          id="isMultiDate"
          className="h-4 w-4 accent-[#9a7a5a]"
          onChange={e => {
            form.setValue('isMultiDate', e.target.checked)
            if (!e.target.checked) setDateCount(1)
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
        <div className="flex flex-col gap-2">
          {Array.from({ length: dateCount }).map((_, i) => (
            <input
              key={i}
              {...register(`dates.${i}`)}
              type="date"
              className={inputClass}
            />
          ))}
        </div>
        {errors.dates && (
          <p className={errorClass}>
            {Array.isArray(errors.dates)
              ? 'All date fields are required'
              : (errors.dates as { message?: string }).message}
          </p>
        )}
        {isMultiDate && dateCount < 5 && (
          <button
            type="button"
            onClick={() => setDateCount(c => c + 1)}
            className="mt-2 text-xs text-[#9a7a5a] underline underline-offset-2"
          >
            + Add another date
          </button>
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

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit 2>&1 | grep BookingFormStep3
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/BookingFormStep3.tsx
git commit -m "feat: add BookingFormStep3 (event detail fields)"
```

---

### Task 7: BookingForm wizard shell

**Files:**
- Create: `src/components/BookingForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  bookingSchema,
  BookingFormData,
  STEP_FIELDS,
} from '@/lib/validations/booking'
import { BookingFormStep1 } from './BookingFormStep1'
import { BookingFormStep2 } from './BookingFormStep2'
import { BookingFormStep3 } from './BookingFormStep3'

const STEP_TITLES = {
  1: '1  Contact',
  2: '2  Service',
  3: '3  Details',
}

export function BookingForm() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      preferredNotify: 'email',
      isMultiDate: false,
      dates: [''],
    },
  })

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const valid = await form.trigger(fields as (keyof BookingFormData)[])
    if (valid) setCurrentStep(s => (s + 1) as 1 | 2 | 3)
  }

  const handleBack = () => {
    setCurrentStep(s => (s - 1) as 1 | 2 | 3)
  }

  const onSubmit = async (data: BookingFormData) => {
    setServerError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const json = await res.json().catch(() => ({}))
        setServerError(json.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="rounded border border-[#e8e0d5] bg-[#f0ebe3] p-6">
        <p className="font-semibold text-[#1a1a1a]">Request sent ✓</p>
        <p className="mt-1 text-sm text-[#666]">
          Thanks — I&apos;ll be in touch within 3 days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {/* Honeypot — hidden from humans, bots fill it */}
      <input
        {...form.register('website')}
        type="text"
        name="website"
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="false"
      />

      {/* Step indicator */}
      <div className="mb-6 flex overflow-hidden rounded border border-[#e8e0d5] text-[11px] font-semibold">
        {([1, 2, 3] as const).map(step => (
          <div
            key={step}
            className={`flex-1 py-2 text-center tracking-wide ${
              step === currentStep
                ? 'bg-[#1a1a1a] text-[#faf7f2]'
                : 'bg-[#f5f0e8] text-[#b0a090]'
            }`}
          >
            {STEP_TITLES[step]}
          </div>
        ))}
      </div>

      {/* Active step */}
      {currentStep === 1 && <BookingFormStep1 form={form} />}
      {currentStep === 2 && <BookingFormStep2 form={form} />}
      {currentStep === 3 && <BookingFormStep3 form={form} />}

      {/* Server error */}
      {serverError && (
        <p className="mt-4 text-sm text-red-600">{serverError}</p>
      )}

      {/* Nav buttons */}
      <div className="mt-6 flex justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-[#9a7a5a] underline underline-offset-2"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="rounded bg-[#1a1a1a] px-5 py-2 text-sm font-semibold text-[#faf7f2] hover:bg-[#333]"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded bg-[#1a1a1a] px-5 py-2 text-sm font-semibold text-[#faf7f2] hover:bg-[#333] disabled:opacity-50"
          >
            {form.formState.isSubmitting ? 'Sending…' : 'Send Request →'}
          </button>
        )}
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit 2>&1 | grep BookingForm
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/BookingForm.tsx
git commit -m "feat: add BookingForm wizard (3-step, single RHF instance)"
```

---

### Task 8: /book page

**Files:**
- Create: `src/app/book/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import type { Metadata } from 'next'
import { BookingForm } from '@/components/BookingForm'

export const metadata: Metadata = {
  title: 'Book Vinh Le — Guitarist, Session Player & Producer',
  description:
    'Request a booking for live shows, session recording, or mixing and mastering.',
}

export default function BookPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2]">
      {/* Nav */}
      <header className="border-b border-[#e8e0d5] px-6 py-4 flex justify-between items-center">
        <span className="text-sm font-bold tracking-widest text-[#1a1a1a] uppercase">
          Vinh Le
        </span>
        <span className="text-xs tracking-widest text-[#9a7a5a] uppercase">
          Book a Session
        </span>
      </header>

      {/* Bio */}
      <section className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-[10px] uppercase tracking-[3px] text-[#9a7a5a] mb-3">
          Guitarist · Session Player · Producer
        </p>
        <h1 className="text-4xl font-bold text-[#1a1a1a] leading-tight mb-4">
          Making records &amp;<br />playing live since 2010.
        </h1>
        <p className="text-[15px] text-[#555] leading-relaxed mb-8 max-w-lg">
          I play guitar and produce for artists across indie, folk, and R&amp;B.
          Available for live shows in the Bay Area, remote session work, and
          mixing/mastering projects. Turnaround in 3–5 days.
        </p>

        {/* Audio/video placeholders */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          {['Sample 1', 'Sample 2', 'Sample 3'].map(label => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded border border-[#e8e0d5] bg-[#f0ebe3] py-6 text-center"
            >
              <span className="text-lg text-[#b0a090]">▶</span>
              <span className="mt-1 text-[10px] text-[#b0a090]">{label}</span>
            </div>
          ))}
        </div>

        <hr className="border-[#e8e0d5] mb-12" />

        {/* Booking form */}
        <div>
          <p className="text-[10px] uppercase tracking-[3px] text-[#9a7a5a] mb-1">
            Request a Booking
          </p>
          <p className="text-sm text-[#888] mb-6">
            I&apos;ll get back to you within 3 days.
          </p>
          <BookingForm />
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit 2>&1 | grep "book/page"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/book/page.tsx
git commit -m "feat: add /book page with bio and booking form"
```

---

### Task 9: Update metadata and globals

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update layout.tsx metadata**

Replace the metadata block in `src/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: {
    default: 'Vinh Le — Guitarist, Session Player & Producer',
    template: '%s | Vinh Le',
  },
  description:
    'Book Vinh Le for live shows, session recording, and mixing/mastering.',
}
```

- [ ] **Step 2: Add warm palette to globals.css**

Append to `src/app/globals.css`:

```css
/* Warm editorial palette */
:root {
  --color-bg: #faf7f2;
  --color-surface: #f0ebe3;
  --color-border: #e8e0d5;
  --color-accent: #9a7a5a;
  --color-text: #1a1a1a;
  --color-muted: #888;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "chore: update metadata and warm palette CSS vars"
```

---

### Task 10: Build, verify, and final commit

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: clean build, no TypeScript errors, routes listed:
```
Route (app)
├ ○ /
├ ○ /book
└ ƒ /api/bookings
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify the happy path**

```bash
npm run dev
```

Open `http://localhost:3000/book`. Verify:
- Bio section renders with placeholder audio blocks
- Step indicator shows "1 Contact" active
- Filling step 1 and clicking "Next →" advances to step 2
- Clicking "← Back" returns to step 1
- Submitting a complete form on step 3 creates a row in Neon (check via `npx prisma studio`)
- Success message appears after submit
- Leaving all fields empty and clicking Next shows validation errors

- [ ] **Step 4: Verify DB row in Prisma Studio**

```bash
npx prisma studio
```

Open `http://localhost:5555`, click `Request` table — confirm the submitted row is there with `status = "pending"`.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: Phase 2 complete — public booking form"
git push origin main
```
