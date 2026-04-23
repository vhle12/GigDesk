'use client'

import { UseFormReturn } from 'react-hook-form'
import { BookingFormData } from '@/lib/validations/booking'

type Props = {
  form: UseFormReturn<BookingFormData>
}

const inputClass =
  'w-full rounded border border-[#ddd6cc] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#b0a090] focus:border-[#9a7a5a] focus:outline-none'
const labelClass =
  'block text-[10px] uppercase tracking-widest text-[#9a7a5a] mb-1'
const errorClass = 'mt-1 text-xs text-red-600'

const SERVICE_LABELS: Record<string, string> = {
  live_show: 'Live show',
  session: 'Session recording',
  mix_master: 'Mixing / mastering',
  other: 'Other',
}

export function BookingFormStep2({ form }: Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = form

  const service = watch('service')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Service *</label>
        <select {...register('service')} className={inputClass}>
          <option value="">Select a service…</option>
          {Object.entries(SERVICE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.service && (
          <p className={errorClass}>{errors.service.message}</p>
        )}
      </div>

      {service === 'other' && (
        <div>
          <label className={labelClass}>Describe the service *</label>
          <input
            {...register('serviceOther')}
            className={inputClass}
            placeholder="Tell me more…"
          />
          {errors.serviceOther && (
            <p className={errorClass}>{errors.serviceOther.message}</p>
          )}
        </div>
      )}
    </div>
  )
}
