CLAUDE.md
This file provides persistent context to Claude Code for this project. Read this before starting any task.
Project
Personal gig booking & management app for a musician (Vinh). Public form lets people request bookings. Private admin dashboard manages requests, gigs, payments, calendar, and analytics. Full spec is in SPEC.md — read it before making architectural decisions.
Tech Stack

Next.js (App Router) + TypeScript
Tailwind CSS
PostgreSQL + Prisma
NextAuth (admin only)
Resend (email)
ICS file generation (calendar attachments)
Deployed on Vercel

Conventions

TypeScript strict mode — no any unless justified in a comment
Server components by default; use "use client" only when needed
Prefer server actions over API routes where reasonable
All forms validated with Zod
Database access via Prisma Client, never raw SQL
Environment variables only via process.env in server code, never exposed to client
Commit messages: conventional commits style (feat:, fix:, chore:, etc.)

Folder structure

/app — Next.js routes
/app/book — public booking form
/app/admin — protected admin dashboard
/app/api — API routes
/lib — shared utilities (db client, email, ics generation)
/components — reusable UI components
/prisma — schema and migrations
/emails — email templates

Always

Run npm run build and npm run lint before declaring a task complete
Create a Prisma migration when schema changes
Update .env.example when adding new env vars
Commit after each working phase
Test the happy path in the UI before marking a phase done

Never

Commit .env or any secrets
Skip TypeScript errors with @ts-ignore without a comment explaining why
Install a heavy dependency when a lightweight one works
Make schema changes without migrations
Expose admin endpoints without auth check

Building phases
Work one phase at a time from the "Build Phases" section in SPEC.md. Don't jump ahead. After finishing a phase, stop and let the user test it before moving on.
When uncertain
Ask. Don't guess at product decisions. If a feature is ambiguous, propose 2-3 options and wait for direction.