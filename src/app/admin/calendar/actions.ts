'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function toggleBlock(
  dateStr: string,
): Promise<{ error?: string }> {
  try {
    // dateStr is YYYY-MM-DD — parse to midnight UTC
    const date = new Date(dateStr + 'T00:00:00.000Z')

    const existing = await db.availabilityBlock.findUnique({
      where: { date },
    })

    if (existing) {
      await db.availabilityBlock.delete({ where: { date } })
    } else {
      await db.availabilityBlock.create({ data: { date } })
    }

    revalidatePath('/admin/calendar')
    return {}
  } catch (err) {
    console.error('[actions] toggleBlock failed:', err)
    return { error: 'Failed to update availability' }
  }
}
