import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { bookingSchema } from '@/lib/validations/booking'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Honeypot check — silent 200 so bots think they succeeded
  if (body.website) {
    return Response.json({ success: true }, { status: 200 })
  }

  const result = bookingSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Invalid request', issues: result.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const data = result.data

  try {
    await db.request.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        preferredNotify: data.preferredNotify,
        bandName: data.bandName ?? null,
        role: data.role ?? null,
        service: data.service,
        serviceOther: data.serviceOther ?? null,
        isMultiDate: data.isMultiDate,
        dates: data.dates.map(d => new Date(d)),
        startTime: data.startTime ?? null,
        duration: data.duration ?? null,
        location: data.location ?? null,
        genre: data.genre ?? null,
        referenceLink: data.referenceLink ?? null,
        budgetRange: data.budgetRange ?? null,
        notes: data.notes ?? null,
        status: 'pending',
      },
    })
    return Response.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[bookings] db error:', err)
    return Response.json({ error: 'Failed to save request' }, { status: 500 })
  }
}
