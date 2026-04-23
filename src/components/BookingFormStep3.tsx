'use client'

import { useState } from 'react'
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

const BUDGET_OPTIONS = [
  { value: '100-250', label: '$100–250' },
  { value: '250-500', label: '$250–500' },
  { value: '500-1000', label: '$500–1,000' },
  { value: '1000+', label: '$1,000+' },
  { value: 'discuss', label: "Let's discuss" },
]

export function BookingFormStep3({ form }: Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = form

  const isMultiDate = watch('isMultiDate')
  const [dateCount, setDateCount] = useState(1)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <input
          {...register('isMultiDate')}
          type="checkbox"
          id="isMultiDate"
          className="h-4 w-4 accent-[#9a7a5a]"
          onChange={e => {
            form.setValue('isMultiDate', e.target.checked)
            if (!e.target.checked) setDateCount(1)
          }}
        />
        <label htmlFor="isMultiDate" className="text-sm text-[#555]">
          This is for multiple dates
        </label>
      </div>

      <div>
        <label className={labelClass}>
          {isMultiDate ? 'Dates *' : 'Date *'}
        </label>
        <div className="flex flex-col gap-2">
          {Array.from({ length: dateCount }).map((_, i) => (
            <input
              key={i}
              {...register(`dates.${i}`)}
              type="date"
              className={inputClass}
            />
          ))}
        </div>
        {errors.dates && (
          <p className={errorClass}>
            {Array.isArray(errors.dates)
              ? 'All date fields are required'
              : (errors.dates as { message?: string }).message}
          </p>
        )}
        {isMultiDate && dateCount < 5 && (
          <button
            type="button"
            onClick={() => setDateCount(c => c + 1)}
            className="mt-2 text-xs text-[#9a7a5a] underline underline-offset-2"
          >
            + Add another date
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start time</label>
          <input
            {...register('startTime')}
            type="time"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Estimated duration</label>
          <input
            {...register('duration')}
            className={inputClass}
            placeholder="e.g. 3 hours"
          />
        </div>

        <div>
          <label className={labelClass}>Location / venue</label>
          <input
            {...register('location')}
            className={inputClass}
            placeholder="Or 'remote' for mixing"
          />
        </div>

        <div>
          <label className={labelClass}>Genre / style</label>
          <input
            {...register('genre')}
            className={inputClass}
            placeholder="e.g. Indie folk"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Reference tracks or links</label>
        <input
          {...register('referenceLink')}
          className={inputClass}
          placeholder="https://…"
        />
        {errors.referenceLink && (
          <p className={errorClass}>{errors.referenceLink.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Budget range</label>
        <select {...register('budgetRange')} className={inputClass}>
          <option value="">Select…</option>
          {BUDGET_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Additional notes</label>
        <textarea
          {...register('notes')}
          rows={4}
          className={inputClass}
          placeholder="Anything else I should know…"
        />
      </div>
    </div>
  )
}
