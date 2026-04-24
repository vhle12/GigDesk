# Phase 5: Admin Pending Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin` pending requests dashboard with card layout, approve/decline/more-info modals, and templated emails for each action.

**Architecture:** Async server component at `/admin` fetches pending requests from Prisma, serializes them (Dates → ISO strings), and passes to `'use client'` `RequestCard` components. Each card manages its own modal state. Server actions update DB status, send emails via Resend, and call `revalidatePath('/admin')` to refresh the list.

**Tech Stack:** Next.js 16 App Router, Prisma 7, Resend v6, TypeScript strict, Tailwind (warm/editorial palette: bg #faf7f2, accent #9a7a5a, surface #f0ebe3, border #e8e0d5)

---

## File Map

| File | Role |
|------|------|
| `src/lib/email.ts` | Add `sendApproval`, `sendDecline`, `sendNeedsInfo` |
| `src/app/admin/actions.ts` | Server actions: `approveRequest`, `declineRequest`, `requestMoreInfo` |
| `src/components/admin/RequestCard.tsx` | `'use client'` card with modal state + action buttons |
| `src/components/admin/ActionModal.tsx` | `'use client'` modal: editable email + confirm/cancel |
| `src/app/admin/page.tsx` | Async server component: fetch pending requests, render cards |

---

### Task 1: Add email functions to `src/lib/email.ts`

**Files:**
- Modify: `src/lib/email.ts`

- [ ] **Step 1: Read the current file**

```bash
cat /Users/vinh/Development/GigDesk/src/lib/email.ts
```

Note the existing `escape()` helper, `SERVICE_LABELS`, `FROM`, `getResend()` — reuse all of them.

- [ ] **Step 2: Append three new functions at the end of `src/lib/email.ts`**

```ts
type RequestSummary = {
  name: string
  email: string
  service: string
  serviceOther: string | null
}

export async function sendApproval(req: RequestSummary): Promise<void> {
  const client = getResend()
  if (!client) {
    console.warn('[email] RESEND_API_KEY not set — skipping approval email')
    return
  }

  const serviceName =
    req.service === 'other' && req.serviceOther
      ? req.serviceOther
      : (SERVICE_LABELS[req.service] ?? req.service)

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf7f2; color: #1a1a1a;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9a7a5a; margin: 0 0 12px;">Vinh Le · Bookings</p>
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px;">Your booking request has been approved</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 20px;">
        Hi ${escape(req.name)} — great news, your request for <strong>${escape(serviceName)}</strong> has been approved. I'll follow up shortly with the final details.
      </p>
      <p style="font-size: 13px; color: #888; margin: 0;">— Vinh</p>
    </div>
  `

  const { error } = await client.emails.send({
    from: `Vinh Le <${FROM}>`,
    to: req.email,
    replyTo: OWNER || undefined,
    subject: 'Your booking request has been approved',
    html,
  })

  if (error) throw error
}

export async function sendDecline(req: RequestSummary, body: string): Promise<void> {
  const client = getResend()
  if (!client) {
    console.warn('[email] RESEND_API_KEY not set — skipping decline email')
    return
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf7f2; color: #1a1a1a;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9a7a5a; margin: 0 0 12px;">Vinh Le · Bookings</p>
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 20px; white-space: pre-line;">${escape(body)}</p>
      <p style="font-size: 13px; color: #888; margin: 0;">— Vinh</p>
    </div>
  `

  const { error } = await client.emails.send({
    from: `Vinh Le <${FROM}>`,
    to: req.email,
    replyTo: OWNER || undefined,
    subject: 'Re: Your booking request',
    html,
  })

  if (error) throw error
}

export async function sendNeedsInfo(req: RequestSummary, body: string): Promise<void> {
  const client = getResend()
  if (!client) {
    console.warn('[email] RESEND_API_KEY not set — skipping needs-info email')
    return
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf7f2; color: #1a1a1a;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9a7a5a; margin: 0 0 12px;">Vinh Le · Bookings</p>
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 20px; white-space: pre-line;">${escape(body)}</p>
      <p style="font-size: 13px; color: #888; margin: 0;">— Vinh</p>
    </div>
  `

  const { error } = await client.emails.send({
    from: `Vinh Le <${FROM}>`,
    to: req.email,
    replyTo: OWNER || undefined,
    subject: 'Re: Your booking request — a quick question',
    html,
  })

  if (error) throw error
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add sendApproval, sendDecline, sendNeedsInfo email functions"
```

---

### Task 2: Server actions (`src/app/admin/actions.ts`)

**Files:**
- Create: `src/app/admin/actions.ts`

- [ ] **Step 1: Create the file**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { sendApproval, sendDecline, sendNeedsInfo } from '@/lib/email'

export async function approveRequest(
  requestId: string,
): Promise<{ error?: string }> {
  try {
    const req = await db.request.update({
      where: { id: requestId },
      data: { status: 'approved' },
      select: { name: true, email: true, service: true, serviceOther: true },
    })
    sendApproval(req).catch(err =>
      console.error('[email] approval email failed:', err),
    )
    revalidatePath('/admin')
    return {}
  } catch (err) {
    console.error('[actions] approveRequest failed:', err)
    return { error: 'Failed to approve request' }
  }
}

export async function declineRequest(
  requestId: string,
  emailBody: string,
): Promise<{ error?: string }> {
  try {
    const req = await db.request.update({
      where: { id: requestId },
      data: { status: 'declined' },
      select: { name: true, email: true, service: true, serviceOther: true },
    })
    sendDecline(req, emailBody).catch(err =>
      console.error('[email] decline email failed:', err),
    )
    revalidatePath('/admin')
    return {}
  } catch (err) {
    console.error('[actions] declineRequest failed:', err)
    return { error: 'Failed to decline request' }
  }
}

export async function requestMoreInfo(
  requestId: string,
  emailBody: string,
): Promise<{ error?: string }> {
  try {
    const req = await db.request.update({
      where: { id: requestId },
      data: { status: 'needs_info' },
      select: { name: true, email: true, service: true, serviceOther: true },
    })
    sendNeedsInfo(req, emailBody).catch(err =>
      console.error('[email] needs-info email failed:', err),
    )
    revalidatePath('/admin')
    return {}
  } catch (err) {
    console.error('[actions] requestMoreInfo failed:', err)
    return { error: 'Failed to send follow-up' }
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
git add src/app/admin/actions.ts
git commit -m "feat: add admin server actions (approve, decline, requestMoreInfo)"
```

---

### Task 3: `ActionModal` component

**Files:**
- Create: `src/components/admin/ActionModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { approveRequest, declineRequest, requestMoreInfo } from '@/app/admin/actions'

type Action = 'approve' | 'decline' | 'needs_info'

type Props = {
  requestId: string
  requesterName: string
  action: Action
  onClose: () => void
}

const ACTION_LABELS: Record<Action, string> = {
  approve: 'Approve',
  decline: 'Decline',
  needs_info: 'Request More Info',
}

const DEFAULT_BODIES: Record<Action, string> = {
  approve: '',
  decline:
    'Hi [name] — thanks for reaching out. Unfortunately I\'m not available for this one, but I\'d love to work together in the future.',
  needs_info:
    'Hi [name] — thanks for your request! Before I confirm, could you share a bit more about what you\'re looking for?',
}

const textareaClass =
  'w-full rounded border border-[#ddd6cc] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#9a7a5a] focus:outline-none resize-none'

export function ActionModal({ requestId, requesterName, action, onClose }: Props) {
  const [emailBody, setEmailBody] = useState(
    DEFAULT_BODIES[action].replace('[name]', requesterName),
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setPending(true)
    setError(null)
    try {
      const result =
        action === 'approve'
          ? await approveRequest(requestId)
          : action === 'decline'
            ? await declineRequest(requestId, emailBody)
            : await requestMoreInfo(requestId, emailBody)

      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-[#e8e0d5] bg-[#faf7f2] p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[3px] text-[#9a7a5a]">
              {ACTION_LABELS[action]}
            </p>
            <h2 className="text-lg font-bold text-[#1a1a1a]">{requesterName}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#9a7a5a] hover:text-[#1a1a1a]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {action === 'approve' ? (
          <div className="mb-4 rounded border border-[#e8e0d5] bg-[#f0ebe3] p-3 text-sm text-[#555]">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-[#9a7a5a]">
              Email preview
            </p>
            <p>
              Hi {requesterName} — great news, your booking request has been
              approved. I&apos;ll follow up shortly with the final details.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#9a7a5a]">
              Email to {requesterName}
            </label>
            <textarea
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              rows={5}
              className={textareaClass}
            />
          </div>
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="text-sm text-[#9a7a5a] underline underline-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="rounded bg-[#1a1a1a] px-5 py-2 text-sm font-semibold text-[#faf7f2] hover:bg-[#333] disabled:opacity-50"
          >
            {pending
              ? 'Sending…'
              : action === 'approve'
                ? 'Confirm & Send'
                : 'Send'}
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
git add src/components/admin/ActionModal.tsx
git commit -m "feat: add ActionModal for approve/decline/more-info actions"
```

---

### Task 4: `RequestCard` component

**Files:**
- Create: `src/components/admin/RequestCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { ActionModal } from './ActionModal'

type Action = 'approve' | 'decline' | 'needs_info'

export type SerializedRequest = {
  id: string
  name: string
  email: string
  service: string
  serviceOther: string | null
  dates: string[]
  location: string | null
  budgetRange: string | null
  notes: string | null
  createdAt: string
  bandName: string | null
}

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

function daysAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function RequestCard({ req }: { req: SerializedRequest }) {
  const [activeAction, setActiveAction] = useState<Action | null>(null)

  const serviceLabel =
    req.service === 'other' && req.serviceOther
      ? req.serviceOther
      : (SERVICE_LABELS[req.service] ?? req.service)

  const dateStr =
    req.dates.length === 1
      ? formatDate(req.dates[0])
      : `${req.dates.length} dates`

  return (
    <>
      <div className="rounded border border-[#e8e0d5] bg-white p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-bold text-[#1a1a1a]">
              {req.name}
              {req.bandName && (
                <span className="ml-2 text-sm font-normal text-[#9a7a5a]">
                  · {req.bandName}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#9a7a5a]">
              {serviceLabel}
              {' · '}
              {dateStr}
              {req.budgetRange && ` · ${BUDGET_LABELS[req.budgetRange] ?? req.budgetRange}`}
            </p>
          </div>
          <span className="text-[11px] text-[#b0a090]">
            {daysAgo(req.createdAt)}
          </span>
        </div>

        {req.notes && (
          <p className="mb-4 text-sm text-[#666] line-clamp-2">
            &ldquo;{req.notes}&rdquo;
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setActiveAction('approve')}
            className="rounded bg-[#1a1a1a] px-4 py-1.5 text-xs font-semibold text-[#faf7f2] hover:bg-[#333]"
          >
            Approve
          </button>
          <button
            onClick={() => setActiveAction('decline')}
            className="rounded border border-[#e8e0d5] bg-[#f0ebe3] px-4 py-1.5 text-xs text-[#9a7a5a] hover:bg-[#e8e0d5]"
          >
            Decline
          </button>
          <button
            onClick={() => setActiveAction('needs_info')}
            className="rounded border border-[#e8e0d5] bg-[#f0ebe3] px-4 py-1.5 text-xs text-[#9a7a5a] hover:bg-[#e8e0d5]"
          >
            More info
          </button>
        </div>
      </div>

      {activeAction && (
        <ActionModal
          requestId={req.id}
          requesterName={req.name}
          action={activeAction}
          onClose={() => setActiveAction(null)}
        />
      )}
    </>
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
git add src/components/admin/RequestCard.tsx
git commit -m "feat: add RequestCard component with approve/decline/more-info buttons"
```

---

### Task 5: Admin dashboard page

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Replace `src/app/admin/page.tsx` with the full dashboard**

```tsx
import { db } from '@/lib/db'
import { RequestCard, type SerializedRequest } from '@/components/admin/RequestCard'

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
        <p className="mb-2 text-[10px] uppercase tracking-[3px] text-[#9a7a5a]">
          Admin Dashboard
        </p>
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

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: build /admin pending requests dashboard with cards"
```

---

### Task 6: Build, verify, and push

- [ ] **Step 1: Run full build**

```bash
cd /Users/vinh/Development/GigDesk && npm run build 2>&1 | tail -20
```

Expected: clean build. Routes include:
```
○ /admin
○ /admin/login
ƒ /api/bookings
```

- [ ] **Step 2: Run lint**

```bash
cd /Users/vinh/Development/GigDesk && npm run lint 2>&1
```

Expected: no errors.

- [ ] **Step 3: Verify the happy path**

Start dev server: `npm run dev`

Test sequence:
1. Visit `http://localhost:3000/admin` — should show "No pending requests" if none exist
2. Submit a booking at `http://localhost:3000/book`
3. Refresh `/admin` — the new request card should appear
4. Click **Approve** → modal opens with email preview → click "Confirm & Send" → card disappears, email fires
5. Submit another booking → click **Decline** → modal opens with editable email → edit the text → click "Send" → card disappears
6. Submit another booking → click **More info** → same flow

- [ ] **Step 4: Push**

```bash
git push origin main
```
