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
