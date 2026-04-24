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
