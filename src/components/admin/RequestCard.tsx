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
