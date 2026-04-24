import { db } from '@/lib/db'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminCalendar } from '@/components/admin/AdminCalendar'

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default async function CalendarPage() {
  const [gigRequests, blocks] = await Promise.all([
    db.request.findMany({
      where: { status: 'approved' },
      select: { dates: true },
    }),
    db.availabilityBlock.findMany({
      select: { date: true },
      orderBy: { date: 'asc' },
    }),
  ])

  // Flatten all confirmed gig dates to YYYY-MM-DD, deduplicated
  const gigDates = [
    ...new Set(gigRequests.flatMap(r => r.dates.map(toYMD))),
  ]
  const blockedDates = blocks.map(b => toYMD(b.date))

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <AdminNav />
        <h1 className="mb-2 text-3xl font-bold text-[#1a1a1a]">Calendar</h1>
        <p className="mb-8 text-sm text-[#888]">
          Click any open date to block it. Click a blocked date to unblock.
        </p>
        <AdminCalendar gigDates={gigDates} blockedDates={blockedDates} />
      </div>
    </main>
  )
}
