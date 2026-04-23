import { Resend } from 'resend'
import type { BookingFormData } from '@/lib/validations/booking'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const OWNER = process.env.OWNER_EMAIL ?? ''

const SERVICE_LABELS: Record<string, string> = {
  live_show: 'Live show',
  session: 'Session recording',
  mix_master: 'Mixing / mastering',
  other: 'Other',
}

const BUDGET_LABELS: Record<string, string> = {
  '100-250': '$100–250',
  '250-500': '$250–500',
  '500-1000': '$500–1,000',
  '1000+': '$1,000+',
  discuss: "Let's discuss",
}

function formatDates(dates: string[]): string {
  return dates
    .map(d => {
      const date = new Date(d)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    })
    .join(', ')
}

function serviceLabel(data: BookingFormData): string {
  if (data.service === 'other' && data.serviceOther) return data.serviceOther
  return SERVICE_LABELS[data.service] ?? data.service
}

export async function sendConfirmation(data: BookingFormData): Promise<void> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf7f2; color: #1a1a1a;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9a7a5a; margin: 0 0 12px;">Vinh Le · Bookings</p>
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px;">Got your booking request</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 20px;">
        Thanks ${escape(data.name)} — I got your request and will be in touch within 3 days.
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 0 0 20px;">
        <tr><td style="padding: 6px 0; color: #9a7a5a; width: 35%;">Service</td><td style="padding: 6px 0;">${escape(serviceLabel(data))}</td></tr>
        <tr><td style="padding: 6px 0; color: #9a7a5a;">${data.isMultiDate ? 'Dates' : 'Date'}</td><td style="padding: 6px 0;">${escape(formatDates(data.dates))}</td></tr>
        ${data.location ? `<tr><td style="padding: 6px 0; color: #9a7a5a;">Location</td><td style="padding: 6px 0;">${escape(data.location)}</td></tr>` : ''}
      </table>
      <p style="font-size: 13px; color: #888; margin: 0;">— Vinh</p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: `Vinh Le <${FROM}>`,
    to: data.email,
    replyTo: OWNER || undefined,
    subject: "Got your booking request — I'll be in touch",
    html,
  })

  if (error) throw error
}

export async function sendOwnerNotification(data: BookingFormData): Promise<void> {
  if (!OWNER) {
    console.warn('[email] OWNER_EMAIL not set — skipping owner notification')
    return
  }

  const rows: [string, string | undefined][] = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Preferred contact', data.preferredNotify],
    ['Band / Project', data.bandName],
    ['Role', data.role],
    ['Service', serviceLabel(data)],
    [data.isMultiDate ? 'Dates' : 'Date', formatDates(data.dates)],
    ['Start time', data.startTime],
    ['Duration', data.duration],
    ['Location', data.location],
    ['Genre', data.genre],
    ['Reference', data.referenceLink],
    ['Budget', data.budgetRange ? BUDGET_LABELS[data.budgetRange] : undefined],
    ['Notes', data.notes],
  ]

  const rowsHtml = rows
    .filter(([, v]) => v && v.length > 0)
    .map(
      ([label, value]) =>
        `<tr><td style="padding: 6px 0; color: #9a7a5a; width: 35%; vertical-align: top;">${escape(label)}</td><td style="padding: 6px 0;">${escape(value!)}</td></tr>`,
    )
    .join('')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf7f2; color: #1a1a1a;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9a7a5a; margin: 0 0 12px;">New Booking Request</p>
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 20px;">${escape(data.name)} — ${escape(serviceLabel(data))}</h1>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 0 0 20px;">
        ${rowsHtml}
      </table>
      <p style="font-size: 13px; color: #888; margin: 0;">Review and approve in the admin dashboard (coming soon).</p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: `GigDesk <${FROM}>`,
    to: OWNER,
    replyTo: data.email,
    subject: `New booking request from ${data.name}`,
    html,
  })

  if (error) throw error
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
