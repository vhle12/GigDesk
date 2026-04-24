# Phase 5: Admin Dashboard — Pending Requests

## Decisions

- **Layout:** Cards with preview — name, service, date(s), budget, notes snippet, received-X-days-ago
- **Actions:** Modal for all three (Approve, Decline, More Info) — prevents accidental approvals
- **Approve modal:** Email preview only, not editable — "Confirm & Send" button
- **Decline / More Info modals:** Editable textarea pre-filled with template
- **After action:** DB status updated, email sent, `revalidatePath('/admin')` — card disappears from list

## File Structure

```
src/
  app/
    admin/
      page.tsx              ← Replace placeholder: server component, fetches pending requests
      actions.ts            ← Server actions: approveRequest, declineRequest, requestMoreInfo
  components/
    admin/
      RequestCard.tsx       ← Card UI with 3 action buttons, receives serialized Request data
      ActionModal.tsx       ← 'use client' modal: editable email + confirm/cancel
  lib/
    email.ts                ← Add sendApproval, sendDecline, sendNeedsInfo
```

## Data Flow

1. `GET /admin` → server component fetches `db.request.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } })`
2. Renders zero or more `<RequestCard>` components (serialized — no Prisma objects passed to client)
3. User clicks action button → `ActionModal` opens (client state)
4. User confirms → server action called → DB update + email send + revalidate
5. Next render: card gone from list

## Status Transitions

| Action | New status |
|---|---|
| Approve | `'approved'` |
| Decline | `'declined'` |
| More Info | `'needs_info'` |

## Server Actions (`admin/actions.ts`)

All three actions:
- Accept `requestId: string` and (for Decline/More Info) `emailBody: string`
- Fetch the request from DB to get requester email/name
- Update status
- Send email via Resend
- Call `revalidatePath('/admin')`

## Email Templates

### Approval (fixed, non-editable)
> "Hi [name] — great news, your booking request has been approved! I'll follow up shortly with the final details."

### Decline (editable, pre-filled)
> "Hi [name] — thanks for reaching out. Unfortunately I'm not available for this one, but I'd love to work together in the future."

### Needs More Info (editable, pre-filled)
> "Hi [name] — thanks for your request! Before I confirm, could you share a bit more about [details]?"

## Components

### `RequestCard`
- Props: serialized request fields (no Prisma types on client)
- Shows: name, service label, date(s), budget range, notes snippet (truncated), received-X-days-ago
- Three buttons: Approve, Decline, More Info — each opens modal with action type

### `ActionModal`
- Props: `requestId`, `requesterName`, `action: 'approve' | 'decline' | 'needs_info'`, `onClose`
- Internal state: `emailBody` (string), `pending` (boolean), `error` (string | null)
- Approve: shows fixed email preview, no textarea
- Decline / More Info: editable `<textarea>` pre-filled with template
- On submit: calls the matching server action, closes on success

## Out of Scope

- ICS attachment on approval emails (Phase 8)
- Post-approval fields (call time, final pay, etc.) — Phase 6
- Logout button — can add to admin nav in Phase 6
