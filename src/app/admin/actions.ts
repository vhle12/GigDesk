'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { sendApproval, sendDecline, sendNeedsInfo } from '@/lib/email'

export async function approveRequest(
  requestId: string,
): Promise<{ error?: string }> {
  try {
    const req = await db.request.update({
      where: { id: requestId },
      data: { status: 'approved' },
      select: { name: true, email: true, service: true, serviceOther: true },
    })
    sendApproval(req).catch(err =>
      console.error('[email] approval email failed:', err),
    )
    revalidatePath('/admin')
    return {}
  } catch (err) {
    console.error('[actions] approveRequest failed:', err)
    return { error: 'Failed to approve request' }
  }
}

export async function declineRequest(
  requestId: string,
  emailBody: string,
): Promise<{ error?: string }> {
  try {
    const req = await db.request.update({
      where: { id: requestId },
      data: { status: 'declined' },
      select: { name: true, email: true, service: true, serviceOther: true },
    })
    sendDecline(req, emailBody).catch(err =>
      console.error('[email] decline email failed:', err),
    )
    revalidatePath('/admin')
    return {}
  } catch (err) {
    console.error('[actions] declineRequest failed:', err)
    return { error: 'Failed to decline request' }
  }
}

export async function requestMoreInfo(
  requestId: string,
  emailBody: string,
): Promise<{ error?: string }> {
  try {
    const req = await db.request.update({
      where: { id: requestId },
      data: { status: 'needs_info' },
      select: { name: true, email: true, service: true, serviceOther: true },
    })
    sendNeedsInfo(req, emailBody).catch(err =>
      console.error('[email] needs-info email failed:', err),
    )
    revalidatePath('/admin')
    return {}
  } catch (err) {
    console.error('[actions] requestMoreInfo failed:', err)
    return { error: 'Failed to send follow-up' }
  }
}
