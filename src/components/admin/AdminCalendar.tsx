'use client'

import { useState } from 'react'
import { toggleBlock } from '@/app/admin/calendar/actions'

export type GigSummary = {
  id: string
  name: string
  bandName: string | null
  service: string
  location: string | null
  dates: string[] // YYYY-MM-DD
}

type Props = {
  gigs: GigSummary[]
  blockedDates: string[] // YYYY-MM-DD strings
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export function AdminCalendar({ gigs, blockedDates }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [pending, setPending] = useState<string | null>(null)
  const [localBlocked, setLocalBlocked] = useState<string[]>(blockedDates)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Build lookup: date → gigs on that date
  const gigsByDate = new Map<string, GigSummary[]>()
  for (const gig of gigs) {
    for (const d of gig.dates) {
      gigsByDate.set(d, [...(gigsByDate.get(d) ?? []), gig])
    }
  }
  const gigDateSet = new Set(gigsByDate.keys())

  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    setSelectedDate(null)
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setSelectedDate(null)
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const handleDayClick = async (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    if (gigDateSet.has(dateStr)) {
      // Toggle detail panel for gig dates
      setSelectedDate(prev => prev === dateStr ? null : dateStr)
      return
    }

    if (pending) return
    setSelectedDate(null)
    setPending(dateStr)

    if (new Set(localBlocked).has(dateStr)) {
      setLocalBlocked(prev => prev.filter(d => d !== dateStr))
    } else {
      setLocalBlocked(prev => [...prev, dateStr])
    }

    const result = await toggleBlock(dateStr)
    if (result.error) {
      setLocalBlocked(blockedDates)
    }
    setPending(null)
  }

  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - startOffset + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  const todayStr = toYMD(today)
  const selectedGigs = selectedDate ? (gigsByDate.get(selectedDate) ?? []) : []

  return (
    <div className="w-full max-w-md">
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={prevMonth} className="rounded px-3 py-1 text-sm text-[#9a7a5a] hover:bg-[#f0ebe3]">←</button>
        <h2 className="text-base font-semibold text-[#1a1a1a]">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="rounded px-3 py-1 text-sm text-[#9a7a5a] hover:bg-[#f0ebe3]">→</button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAYS.map(d => (
          <div key={d} className="py-1 text-[10px] font-medium text-[#b0a090]">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isGig = gigDateSet.has(dateStr)
          const isBlocked = new Set(localBlocked).has(dateStr)
          const isToday = dateStr === todayStr
          const isPending = pending === dateStr
          const isSelected = selectedDate === dateStr

          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              disabled={isPending}
              title={
                isGig ? 'Click to view booking details'
                : isBlocked ? 'Blocked — click to unblock'
                : 'Click to block'
              }
              className={[
                'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors',
                isGig && isSelected
                  ? 'bg-[#9a7a5a] text-[#faf7f2] cursor-pointer'
                  : isGig
                    ? 'bg-[#1a1a1a] text-[#faf7f2] cursor-pointer hover:bg-[#333]'
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

      {/* Gig detail panel */}
      {selectedDate && selectedGigs.length > 0 && (
        <div className="mt-4 rounded border border-[#e8e0d5] bg-[#f0ebe3] p-4">
          <p className="mb-3 text-[10px] uppercase tracking-[2px] text-[#9a7a5a]">
            {formatDate(selectedDate)}
          </p>
          <div className="flex flex-col gap-3">
            {selectedGigs.map(gig => (
              <div key={gig.id} className="rounded bg-white border border-[#e8e0d5] px-3 py-2">
                <p className="font-semibold text-sm text-[#1a1a1a]">
                  {gig.name}
                  {gig.bandName && <span className="ml-1 font-normal text-[#9a7a5a]">· {gig.bandName}</span>}
                </p>
                <p className="text-[11px] text-[#9a7a5a]">
                  {gig.service}
                  {gig.location && ` · ${gig.location}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
