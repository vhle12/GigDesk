'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

type UpdateGigData = {
  finalPay: string | null
  callTime: string | null
  loadInTime: string | null
  isPaid: boolean
  postGigNotes: string | null
}

export async function updateGig(
  id: string,
  data: UpdateGigData,
): Promise<{ error?: string }> {
  try {
    await db.request.update({
      where: { id },
      data: {
        finalPay: data.finalPay ?? null,
        callTime: data.callTime,
        loadInTime: data.loadInTime,
        isPaid: data.isPaid,
        postGigNotes: data.postGigNotes,
      },
    })
    revalidatePath('/admin/gigs')
    return {}
  } catch (err) {
    console.error('[actions] updateGig failed:', err)
    return { error: 'Failed to save changes' }
  }
}
