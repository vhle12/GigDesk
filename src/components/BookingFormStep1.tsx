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

export function BookingFormStep1({ form }: Props) {
  const { register, formState: { errors } } = form

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass}>Name *</label>
        <input
          {...register('name')}
          className={inputClass}
          placeholder="Your name"
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Email *</label>
        <input
          {...register('email')}
          type="email"
          className={inputClass}
          placeholder="you@example.com"
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Phone</label>
        <input
          {...register('phone')}
          type="tel"
          className={inputClass}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className={labelClass}>Preferred contact *</label>
        <select {...register('preferredNotify')} className={inputClass}>
          <option value="">Select…</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>
        {errors.preferredNotify && (
          <p className={errorClass}>{errors.preferredNotify.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Band / Project</label>
        <input
          {...register('bandName')}
          className={inputClass}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className={labelClass}>Your role</label>
        <input
          {...register('role')}
          className={inputClass}
          placeholder="e.g. Band leader, Producer"
        />
      </div>
    </div>
  )
}
