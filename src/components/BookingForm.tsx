'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  bookingSchema,
  BookingFormData,
  STEP_FIELDS,
} from '@/lib/validations/booking'
import { BookingFormStep1 } from './BookingFormStep1'
import { BookingFormStep2 } from './BookingFormStep2'
import { BookingFormStep3 } from './BookingFormStep3'

const STEP_TITLES = {
  1: '1  Contact',
  2: '2  Service',
  3: '3  Details',
}

export function BookingForm() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      preferredNotify: 'email',
      bandName: '',
      role: '',
      service: 'live_show',
      serviceOther: '',
      isMultiDate: false,
      dates: [''],
      startTime: '',
      duration: '',
      location: '',
      genre: '',
      referenceLink: '',
      budgetRange: 'discuss',
      notes: '',
      website: '',
    } as BookingFormData,
  })

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const valid = await form.trigger(fields as (keyof BookingFormData)[])
    if (valid) setCurrentStep(s => (s + 1) as 1 | 2 | 3)
  }

  const handleBack = () => {
    setCurrentStep(s => (s - 1) as 1 | 2 | 3)
  }

  const onSubmit = async (data: BookingFormData) => {
    setServerError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const json = await res.json().catch(() => ({}))
        setServerError(json.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="rounded border border-[#e8e0d5] bg-[#f0ebe3] p-6">
        <p className="font-semibold text-[#1a1a1a]">Request sent ✓</p>
        <p className="mt-1 text-sm text-[#666]">
          Thanks — I&apos;ll be in touch within 3 days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {/* Honeypot — hidden from humans, bots fill it */}
      <input
        {...form.register('website')}
        type="text"
        name="website"
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="false"
      />

      {/* Step indicator */}
      <div className="mb-6 flex overflow-hidden rounded border border-[#e8e0d5] text-[11px] font-semibold">
        {([1, 2, 3] as const).map(step => (
          <div
            key={step}
            className={`flex-1 py-2 text-center tracking-wide ${
              step === currentStep
                ? 'bg-[#1a1a1a] text-[#faf7f2]'
                : 'bg-[#f5f0e8] text-[#b0a090]'
            }`}
          >
            {STEP_TITLES[step]}
          </div>
        ))}
      </div>

      {/* Active step */}
      {currentStep === 1 && <BookingFormStep1 form={form} />}
      {currentStep === 2 && <BookingFormStep2 form={form} />}
      {currentStep === 3 && <BookingFormStep3 form={form} />}

      {/* Server error */}
      {serverError && (
        <p className="mt-4 text-sm text-red-600">{serverError}</p>
      )}

      {/* Nav buttons */}
      <div className="mt-6 flex justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-[#9a7a5a] underline underline-offset-2"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="rounded bg-[#1a1a1a] px-5 py-2 text-sm font-semibold text-[#faf7f2] hover:bg-[#333]"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded bg-[#1a1a1a] px-5 py-2 text-sm font-semibold text-[#faf7f2] hover:bg-[#333] disabled:opacity-50"
          >
            {form.formState.isSubmitting ? 'Sending…' : 'Send Request →'}
          </button>
        )}
      </div>
    </form>
  )
}
