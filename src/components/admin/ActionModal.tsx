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
    "Hi [name] — thanks for reaching out. Unfortunately I'm not available for this one, but I'd love to work together in the future.",
  needs_info:
    "Hi [name] — thanks for your request! Before I confirm, could you share a bit more about what you're looking for?",
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
