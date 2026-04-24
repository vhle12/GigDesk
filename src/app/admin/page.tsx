import { db } from '@/lib/db'
import { RequestCard, type SerializedRequest } from '@/components/admin/RequestCard'
import { logout } from './actions'

export default async function AdminPage() {
  const requests = await db.request.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      service: true,
      serviceOther: true,
      dates: true,
      location: true,
      budgetRange: true,
      notes: true,
      createdAt: true,
      bandName: true,
    },
  })

  const serialized: SerializedRequest[] = requests.map(r => ({
    ...r,
    dates: r.dates.map(d => d.toISOString()),
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[3px] text-[#9a7a5a]">
              Admin Dashboard
            </p>
            <h1 className="text-3xl font-bold text-[#1a1a1a]">
              Pending Requests
              {serialized.length > 0 && (
                <span className="ml-3 text-xl font-normal text-[#9a7a5a]">
                  ({serialized.length})
                </span>
              )}
            </h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-[#9a7a5a] underline underline-offset-2 hover:text-[#1a1a1a]"
            >
              Sign out
            </button>
          </form>
        </div>

        {serialized.length === 0 ? (
          <p className="text-sm text-[#888]">No pending requests — you&apos;re all caught up.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {serialized.map(req => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
