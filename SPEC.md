Gig Booking App — Specification
Overview
A personal booking and gig management app for Vinh Le (musician/producer). Public-facing booking form lets people request time for live shows, session work, or mixing/mastering. Private admin dashboard handles approvals, tracking, payment status, calendar syncing, and analytics.
No user accounts for requesters — low friction. Single admin (me).

Tech Stack

Framework: Next.js (App Router) + TypeScript
Styling: Tailwind CSS
Database: PostgreSQL (Neon or Supabase free tier)
ORM: Prisma
Auth (admin only): NextAuth with a single credential, or hashed password env var
Email: Resend
Calendar: ICS file generation (works with Apple Calendar, Google Calendar, Outlook, etc.)
Deployment: Vercel
Forms: React Hook Form + Zod for validation


Public Page (/book)
Landing page that doubles as a marketing surface.
Sections (top to bottom)

Short bio / headline (guitarist, session player, mixer/producer)
Work samples (embedded audio/video — placeholder for now)
Past collaborators or notable projects
Link to full socials
"Request to book" form

Booking Form Fields
Contact

Name (required)
Email (required)
Phone (optional)
Preferred notification method — dropdown: Email / Phone
Band or project name
Their role (band leader, producer, artist, manager, etc.)

Service — dropdown (required)

Live show
Session recording
Mixing/mastering
Other (opens a text field)

Event/project details

Is this for multiple dates? — checkbox

If yes, allow up to 5 date fields


Date(s) — date picker (greys out unavailable dates from admin availability blocks)
Start time + estimated duration
Location/venue (or "remote" for mixing/producing)
Genre/style
Reference tracks or links (optional URL field)
Budget range — dropdown ($100–250, $250–500, $500–1000, $1000+, "let's discuss")
Additional notes (free text)

Anti-spam

Hidden honeypot field

On submit

Request saved to DB with status = "pending"
Email to Vinh with request summary + link to admin
Confirmation email to requester including stated response time


Admin Dashboard (/admin, password-protected)
1. Pending Requests

List of all requests with status = "pending"
Each row: Approve / Decline / Request More Info
Approve → moves to Confirmed Gigs, sends approval email with ICS attachment, admin gets a "Download .ics" button to add to their own calendar
Decline → sends templated decline email (editable before send)
Request More Info → sends templated follow-up email

2. Confirmed Gigs

List of approved gigs
Extra fields that unlock post-approval:

Final pay ($)
Call time
Load-in time (for live shows)
Paid/unpaid toggle
Post-gig notes


Filter by upcoming / past / unpaid

3. Calendar View

Monthly and weekly views of confirmed gigs
Click a date to block it as unavailable
Blocked dates are greyed out on the public form

4. Analytics

Requests received vs. accepted (conversion rate)
Most frequent collaborators (by band/project name)
Revenue by service type
Gigs per month (chart)
Upcoming unpaid gigs

5. History

Searchable archive of all requests (any status)
Filter by service, date range, band name, status


Database Schema (Prisma)
prismamodel Request {
  id                  String   @id @default(cuid())
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // Contact
  name                String
  email               String
  phone               String?
  preferredNotify     String   // "email" | "phone"
  bandName            String?
  role                String?

  // Service
  service             String   // "live_show" | "session" | "mix_master" | "other"
  serviceOther        String?

  // Event
  isMultiDate         Boolean  @default(false)
  dates               DateTime[]
  startTime           String?
  duration            String?
  location            String?
  genre               String?
  referenceLink       String?
  budgetRange         String?
  notes               String?

  // Status
  status              String   @default("pending") // "pending" | "approved" | "declined" | "needs_info"

  // Post-approval (Confirmed Gig fields)
  finalPay            Decimal?
  callTime            String?
  loadInTime          String?
  isPaid              Boolean  @default(false)
  postGigNotes        String?
}

model AvailabilityBlock {
  id        String   @id @default(cuid())
  date      DateTime @unique
  reason    String?
  createdAt DateTime @default(now())
}

Email Templates

Confirmation (to requester on submit) — "Got your request, I'll respond within 3 days"
Approval (to requester) — "Approved, here are the next steps"
Decline (to requester, editable before send) — "Unfortunately not available"
Needs more info (to requester) — "Can you clarify X"
New request (to Vinh) — full request summary + admin link


Environment Variables
DATABASE_URL=
RESEND_API_KEY=
ADMIN_PASSWORD_HASH=
NEXTAUTH_SECRET=
OWNER_EMAIL=  // where new request notifications go

Build Phases (for Claude Code)
Build in this order. Commit after each phase.

Phase 1: Project setup

Next.js + TS + Tailwind scaffold
Prisma init + schema
Connect to Postgres, run first migration
Env variable structure


Phase 2: Public booking form

/book page with bio placeholder + form
Form validation with Zod
API route to POST new request
Honeypot field
Basic styling


Phase 3: Email integration

Resend setup
Confirmation email to requester
Notification email to owner


Phase 4: Admin auth

NextAuth or simple password gate
/admin protected route


Phase 5: Admin dashboard — pending requests

List view
Approve / Decline / Request Info actions
Templated emails for each action


Phase 6: Confirmed gigs view

Post-approval fields
Paid/unpaid toggle
Upcoming / past / unpaid filters


Phase 7: Availability blocks + calendar view

Admin can block dates
Public form reflects blocked dates
Calendar view of gigs


Phase 8: ICS calendar file generation

Install ics npm package
Generate ICS files for approved gigs
Attach ICS to approval emails
Add "Download .ics" button in admin dashboard


Phase 9: Analytics

Stats queries
Charts


Phase 10: History + polish

Searchable archive
Marketing content on /book
Final styling pass




Out of Scope (v1)

SMS notifications (email only for v1)
Public rates
Payment collection (tracking only)
Multiple admins
Captcha (honeypot only for now)