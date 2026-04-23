import { z } from 'zod'

const optStr = z.string().transform(v => v.trim() || undefined).optional()

export const bookingSchema = z.object({
  // Contact
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: optStr,
  preferredNotify: z.enum(['email', 'phone']),
  bandName: optStr,
  role: optStr,

  // Service
  service: z.enum(['live_show', 'session', 'mix_master', 'other']),
  serviceOther: optStr,

  // Event
  isMultiDate: z.boolean().default(false),
  dates: z
    .array(z.string().min(1))
    .min(1, 'At least one date is required')
    .max(5),
  startTime: optStr,
  duration: optStr,
  location: optStr,
  genre: optStr,
  referenceLink: z
    .string()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal('')),
  budgetRange: z
    .enum(['100-250', '250-500', '500-1000', '1000+', 'discuss'])
    .optional(),
  notes: optStr,

  // Honeypot — must be empty
  website: z.string().max(0).optional(),
})

export type BookingFormData = z.infer<typeof bookingSchema>

// Field names per step — used for per-step validation in the wizard
export const STEP_FIELDS = {
  1: ['name', 'email', 'phone', 'preferredNotify', 'bandName', 'role'],
  2: ['service', 'serviceOther'],
  3: [
    'isMultiDate',
    'dates',
    'startTime',
    'duration',
    'location',
    'genre',
    'referenceLink',
    'budgetRange',
    'notes',
  ],
} as const satisfies Record<number, (keyof BookingFormData)[]>
