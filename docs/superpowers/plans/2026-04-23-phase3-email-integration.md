# Phase 3: Email Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a confirmation email to the requester and a full-summary notification email to the owner after every successful booking, using Resend. Email failures log to console but never block the 201 response.

**Architecture:** Single `src/lib/email.ts` exports `sendConfirmation(data)` and `sendOwnerNotification(data)`. The API route dispatches both without `await` after the DB write. HTML templates are inline string literals matching the warm/editorial palette.

**Tech Stack:** Next.js 16 App Router, Resend SDK, existing Zod `BookingFormData` type

---

## File Map

| File | Role |
|------|------|
| `.env.example` | Add `RESEND_FROM_EMAIL` with default `onboarding@resend.dev` |
| `.env` | Same — user adds real `RESEND_API_KEY` and `OWNER_EMAIL` |
| `src/lib/email.ts` | Resend client singleton + `sendConfirmation` + `sendOwnerNotification` |
| `src/app/api/bookings/route.ts` | Fire both emails after `db.request.create`, catch per-promise |

---

### Task 1: Install Resend SDK and update `.env.example`

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.example`

- [ ] **Step 1: Install the Resend SDK**

```bash
cd /Users/vinh/Development/GigDesk
npm install resend
```

- [ ] **Step 2: Verify installation**

```bash
npm list resend
```

Expected: shows `resend@<version>` (3.x or 4.x at time of writing).

- [ ] **Step 3: Update `.env.example`**

Replace the `RESEND_API_KEY=` line with these two lines:

```
RESEND_API_KEY=
# Use onboarding@resend.dev for dev; swap to a verified domain for prod
RESEND_FROM_EMAIL=onboarding@resend.dev
```

The final `.env.example` should look like:

```
# Pooled connection — used by Prisma Client at runtime
DATABASE_URL=postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require

# Direct connection — used by Prisma CLI for migrations (no -pooler in hostname)
DIRECT_URL=postgresql://user:password@host.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require

RESEND_API_KEY=
# Use onboarding@resend.dev for dev; swap to a verified domain for prod
RESEND_FROM_EMAIL=onboarding@resend.dev

# bcrypt hash of your admin password — generate with: node -e "require('bcryptjs').hash('yourpassword',10).then(console.log)"
ADMIN_PASSWORD_HASH=

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Email address where new booking requests are sent
OWNER_EMAIL=
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install resend, add RESEND_FROM_EMAIL to env.example"
```

---

### Task 2: Create `src/lib/email.ts`

**Files:**
- Create: `src/lib/email.ts`

- [ ] **Step 1: Create the file**

```ts
import { Resend } from 'resend'
import type { BookingFormData } from '@/lib/validations/booking'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const OWNER = process.env.OWNER_EMAIL ?? ''

const SERVICE_LABELS: Record<string, string> = {
  live_show: 'Live show',
  session: 'Session recording',
  mix_master: 'Mixing / mastering',
  other: 'Other',
}

const BUDGET_LABELS: Record<string, string> = {
  '100-250': '$100–250',
  '250-500': '$250–500',
  '500-1000': '$500–1,000',
  '1000+': '$1,000+',
  discuss: "Let's discuss",
}

function formatDates(dates: string[]): string {
  return dates
    .map(d => {
      const date = new Date(d)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    })
    .join(', ')
}

function serviceLabel(data: BookingFormData): string {
  if (data.service === 'other' && data.serviceOther) return data.serviceOther
  return SERVICE_LABELS[data.service] ?? data.service
}

export async function sendConfirmation(data: BookingFormData): Promise<void> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf7f2; color: #1a1a1a;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9a7a5a; margin: 0 0 12px;">Vinh Le · Bookings</p>
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px;">Got your booking request</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 20px;">
        Thanks ${escape(data.name)} — I got your request and will be in touch within 3 days.
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 0 0 20px;">
        <tr><td style="padding: 6px 0; color: #9a7a5a; width: 35%;">Service</td><td style="padding: 6px 0;">${escape(serviceLabel(data))}</td></tr>
        <tr><td style="padding: 6px 0; color: #9a7a5a;">${data.isMultiDate ? 'Dates' : 'Date'}</td><td style="padding: 6px 0;">${escape(formatDates(data.dates))}</td></tr>
        ${data.location ? `<tr><td style="padding: 6px 0; color: #9a7a5a;">Location</td><td style="padding: 6px 0;">${escape(data.location)}</td></tr>` : ''}
      </table>
      <p style="font-size: 13px; color: #888; margin: 0;">— Vinh</p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: `Vinh Le <${FROM}>`,
    to: data.email,
    replyTo: OWNER || undefined,
    subject: "Got your booking request — I'll be in touch",
    html,
  })

  if (error) throw error
}

export async function sendOwnerNotification(data: BookingFormData): Promise<void> {
  if (!OWNER) {
    console.warn('[email] OWNER_EMAIL not set — skipping owner notification')
    return
  }

  const rows: [string, string | undefined][] = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Preferred contact', data.preferredNotify],
    ['Band / Project', data.bandName],
    ['Role', data.role],
    ['Service', serviceLabel(data)],
    [data.isMultiDate ? 'Dates' : 'Date', formatDates(data.dates)],
    ['Start time', data.startTime],
    ['Duration', data.duration],
    ['Location', data.location],
    ['Genre', data.genre],
    ['Reference', data.referenceLink],
    ['Budget', data.budgetRange ? BUDGET_LABELS[data.budgetRange] : undefined],
    ['Notes', data.notes],
  ]

  const rowsHtml = rows
    .filter(([, v]) => v && v.length > 0)
    .map(
      ([label, value]) =>
        `<tr><td style="padding: 6px 0; color: #9a7a5a; width: 35%; vertical-align: top;">${escape(label)}</td><td style="padding: 6px 0;">${escape(value!)}</td></tr>`,
    )
    .join('')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf7f2; color: #1a1a1a;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9a7a5a; margin: 0 0 12px;">New Booking Request</p>
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 20px;">${escape(data.name)} — ${escape(serviceLabel(data))}</h1>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 0 0 20px;">
        ${rowsHtml}
      </table>
      <p style="font-size: 13px; color: #888; margin: 0;">Review and approve in the admin dashboard (coming soon).</p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: `GigDesk <${FROM}>`,
    to: OWNER,
    replyTo: data.email,
    subject: `New booking request from ${data.name}`,
    html,
  })

  if (error) throw error
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add email module with confirmation and owner-notification templates"
```

---

### Task 3: Wire emails into `/api/bookings` route

**Files:**
- Modify: `src/app/api/bookings/route.ts`

- [ ] **Step 1: Update the route file**

Replace the entire contents of `src/app/api/bookings/route.ts` with:

```ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendConfirmation, sendOwnerNotification } from '@/lib/email'
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

  try {
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
        referenceLink: data.referenceLink ?? null,
        budgetRange: data.budgetRange ?? null,
        notes: data.notes ?? null,
        status: 'pending',
      },
    })
  } catch (err) {
    console.error('[bookings] db error:', err)
    return Response.json({ error: 'Failed to save request' }, { status: 500 })
  }

  // Fire-and-forget — email failures log but don't block the response
  sendConfirmation(data).catch(err =>
    console.error('[email] confirmation failed:', err),
  )
  sendOwnerNotification(data).catch(err =>
    console.error('[email] owner notify failed:', err),
  )

  return Response.json({ success: true }, { status: 201 })
}
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/route.ts
git commit -m "feat: dispatch confirmation and owner emails after booking DB write"
```

---

### Task 4: Build, verify, and push

- [ ] **Step 1: Run the full build**

```bash
cd /Users/vinh/Development/GigDesk && npm run build
```

Expected: clean build. Routes listed include `ƒ /api/bookings`.

- [ ] **Step 2: Run lint**

```bash
cd /Users/vinh/Development/GigDesk && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Remind user to set env vars before testing**

Print to the user:

```
Before testing in dev, add these to .env:
  RESEND_API_KEY=re_xxxxx   (get from https://resend.com/api-keys)
  RESEND_FROM_EMAIL=onboarding@resend.dev   (already in .env.example default)
  OWNER_EMAIL=you@icloud.com   (where booking notifications go)
```

Do NOT start `npm run dev` — user will test.

- [ ] **Step 4: Push**

```bash
git push origin main
```

Expected: two commits (or three, if task 1 and task 4 are separate) pushed to origin.
