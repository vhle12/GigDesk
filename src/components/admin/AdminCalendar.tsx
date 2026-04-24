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
    if (new Set(localBlocked).has(dateStr)) {
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
