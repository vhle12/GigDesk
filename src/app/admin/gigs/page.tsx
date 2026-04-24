import { db } from '@/lib/db'
import { AdminNav } from '@/components/admin/AdminNav'
import { GigList } from '@/components/admin/GigList'
import type { SerializedGig } from '@/components/admin/GigCard'

export default async function GigsPage() {
  const gigs = await db.request.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      bandName: true,
      service: true,
      serviceOther: true,
      dates: true,
      location: true,
      finalPay: true,
      callTime: true,
      loadInTime: true,
      isPaid: true,
      postGigNotes: true,
    },
  })

  const serialized: SerializedGig[] = gigs.map(g => ({
    ...g,
    dates: g.dates.map(d => d.toISOString()),
    finalPay: g.finalPay?.toString() ?? null,
  }))

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <AdminNav />
        <h1 className="mb-8 text-3xl font-bold text-[#1a1a1a]">
          Confirmed Gigs
          {serialized.length > 0 && (
            <span className="ml-3 text-xl font-normal text-[#9a7a5a]">
              ({serialized.length})
            </span>
          )}
        </h1>

        {serialized.length === 0 ? (
          <p className="text-sm text-[#888]">No confirmed gigs yet.</p>
        ) : (
          <GigList gigs={serialized} />
        )}
      </div>
    </main>
  )
}
