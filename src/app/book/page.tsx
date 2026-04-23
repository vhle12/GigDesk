import type { Metadata } from 'next'
import { BookingForm } from '@/components/BookingForm'

export const metadata: Metadata = {
  title: 'Book Vinh Le — Guitarist, Session Player & Producer',
  description:
    'Request a booking for live shows, session recording, or mixing and mastering.',
}

export default function BookPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2]">
      {/* Nav */}
      <header className="border-b border-[#e8e0d5] px-6 py-4 flex justify-between items-center">
        <span className="text-sm font-bold tracking-widest text-[#1a1a1a] uppercase">
          Vinh Le
        </span>
        <span className="text-xs tracking-widest text-[#9a7a5a] uppercase">
          Book a Session
        </span>
      </header>

      {/* Bio */}
      <section className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-[10px] uppercase tracking-[3px] text-[#9a7a5a] mb-3">
          Guitarist · Session Player · Producer
        </p>
        <h1 className="text-4xl font-bold text-[#1a1a1a] leading-tight mb-4">
          Making records &amp;<br />playing live since 2010.
        </h1>
        <p className="text-[15px] text-[#555] leading-relaxed mb-8 max-w-lg">
          I play guitar and produce for artists across indie, folk, and R&amp;B.
          Available for live shows in the Bay Area, remote session work, and
          mixing/mastering projects. Turnaround in 3–5 days.
        </p>

        {/* Audio/video placeholders */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          {['Sample 1', 'Sample 2', 'Sample 3'].map(label => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded border border-[#e8e0d5] bg-[#f0ebe3] py-6 text-center"
            >
              <span className="text-lg text-[#b0a090]">▶</span>
              <span className="mt-1 text-[10px] text-[#b0a090]">{label}</span>
            </div>
          ))}
        </div>

        <hr className="border-[#e8e0d5] mb-12" />

        {/* Booking form */}
        <div>
          <p className="text-[10px] uppercase tracking-[3px] text-[#9a7a5a] mb-1">
            Request a Booking
          </p>
          <p className="text-sm text-[#888] mb-6">
            I&apos;ll get back to you within 3 days.
          </p>
          <BookingForm />
        </div>
      </section>
    </main>
  )
}
