'use client'

import { useEffect, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
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
    setValue,
    formState: { errors },
  } = form

  const isMultiDate = watch('isMultiDate')

  // Selected dates as Date objects (synced to RHF string array)
  const [selected, setSelected] = useState<Date[]>([])
  // Blocked dates fetched from API
  const [blockedDates, setBlockedDates] = useState<Date[]>([])

  // Fetch blocked dates once on mount
  useEffect(() => {
    fetch('/api/blocked-dates')
      .then(r => r.json())
      .then((dates: string[]) =>
        setBlockedDates(dates.map(d => new Date(d + 'T00:00:00.000Z'))),
      )
      .catch(() => {}) // non-critical — fail silently
  }, [])

  // Sync selected dates to RHF 'dates' field as YYYY-MM-DD strings
  const syncToForm = (dates: Date[]) => {
    setValue(
      'dates',
      dates.map(d => d.toISOString().split('T')[0]),
      { shouldValidate: true },
    )
  }

  const disabled = [{ before: new Date() }, ...blockedDates]

  const handleSingleSelect = (date: Date | undefined) => {
    const next = date ? [date] : []
    setSelected(next)
    syncToForm(next)
  }

  const handleMultiSelect = (dates: Date[] | undefined) => {
    const next = dates ?? []
    setSelected(next)
    syncToForm(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <input
          {...register('isMultiDate')}
          type="checkbox"
          id="isMultiDate"
          className="h-4 w-4 accent-[#9a7a5a]"
          onChange={e => {
            setValue('isMultiDate', e.target.checked)
            // Reset selection when toggling mode
            setSelected([])
            syncToForm([])
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
        <div className="rounded border border-[#e8e0d5] bg-white p-2">
          {isMultiDate ? (
            <DayPicker
              mode="multiple"
              selected={selected}
              onSelect={handleMultiSelect}
              disabled={disabled}
              max={5}
            />
          ) : (
            <DayPicker
              mode="single"
              selected={selected[0]}
              onSelect={handleSingleSelect}
              disabled={disabled}
            />
          )}
        </div>
        {selected.length === 0 && errors.dates && (
          <p className={errorClass}>
            {(errors.dates as { message?: string }).message ?? 'Please select a date'}
          </p>
        )}
        {isMultiDate && selected.length > 0 && (
          <p className="mt-1 text-xs text-[#9a7a5a]">
            {selected.length} date{selected.length > 1 ? 's' : ''} selected (max 5)
          </p>
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
