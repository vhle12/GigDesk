import { db } from '@/lib/db'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminCalendar, type GigSummary } from '@/components/admin/AdminCalendar'

const SERVICE_LABELS: Record<string, string> = {
  live_show: 'Live show',
  session: 'Session recording',
  mix_master: 'Mixing / mastering',
  other: 'Other',
}

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default async function CalendarPage() {
  const [gigRequests, blocks] = await Promise.all([
    db.request.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        bandName: true,
        service: true,
        serviceOther: true,
        location: true,
        dates: true,
      },
    }),
    db.availabilityBlock.findMany({
      select: { date: true },
      orderBy: { date: 'asc' },
    }),
  ])

  const gigs: GigSummary[] = gigRequests.map(r => ({
    id: r.id,
    name: r.name,
    bandName: r.bandName,
    service: r.service === 'other' && r.serviceOther
      ? r.serviceOther
      : (SERVICE_LABELS[r.service] ?? r.service),
    location: r.location,
    dates: r.dates.map(toYMD),
  }))

  const blockedDates = blocks.map(b => toYMD(b.date))

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <AdminNav />
        <h1 className="mb-2 text-3xl font-bold text-[#1a1a1a]">Calendar</h1>
        <p className="mb-8 text-sm text-[#888]">
          Click a gig date to see booking details. Click any open date to block it.
        </p>
        <AdminCalendar gigs={gigs} blockedDates={blockedDates} />
      </div>
    </main>
  )
}
