import { db } from '@/lib/db'

export async function GET() {
  const blocks = await db.availabilityBlock.findMany({
    select: { date: true },
    orderBy: { date: 'asc' },
  })
  // Return YYYY-MM-DD strings — avoids timezone issues in the browser
  return Response.json(
    blocks.map(b => b.date.toISOString().split('T')[0]),
  )
}
