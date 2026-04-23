# Phase 4: Admin Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect `/admin/*` routes behind a password login, using bcrypt comparison + jose JWT session cookie.

**Architecture:** Login server action (Node.js) compares bcrypt password → signs 7-day JWT → sets httpOnly `admin-session` cookie. Next.js 16 Proxy (`proxy.ts`, NOT `middleware.ts`) verifies the JWT on every `/admin/*` request except `/admin/login` and redirects to login on failure.

**Tech Stack:** Next.js 16 App Router, `bcryptjs`, `jose`, `next/headers` cookies API (async), `useActionState` for login form error state

---

## File Map

| File | Role |
|------|------|
| `src/lib/session.ts` | `signSession()` + `verifySession()` — jose JWT helpers |
| `src/app/admin/login/page.tsx` | Login page — `'use client'`, `useActionState` |
| `src/app/admin/login/actions.ts` | `login` server action — bcrypt compare, set cookie, redirect |
| `src/app/admin/page.tsx` | `/admin` placeholder — server component, protected by proxy |
| `proxy.ts` | Next.js 16 Proxy (renamed from middleware) — JWT check on `/admin/*` |

> **Next.js 16 note:** Middleware is now called **Proxy**. The file MUST be named `proxy.ts` at the project root (same level as `src/`). The exported function MUST be named `proxy` (or a default export). `middleware.ts` will NOT work.

---

### Task 1: Install dependencies and set env vars

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env`

- [ ] **Step 1: Install bcryptjs and jose**

```bash
cd /Users/vinh/Development/GigDesk
npm install bcryptjs jose
npm install --save-dev @types/bcryptjs
```

- [ ] **Step 2: Verify**

```bash
npm list bcryptjs jose @types/bcryptjs
```

Expected: all three listed under `gigdesk@0.1.0`.

- [ ] **Step 3: Generate ADMIN_PASSWORD_HASH**

Run this command (replace `yourpassword` with the actual admin password):

```bash
node -e "const b = require('bcryptjs'); b.hash('yourpassword', 10).then(console.log)"
```

Copy the output hash (starts with `$2b$10$...`).

- [ ] **Step 4: Generate NEXTAUTH_SECRET**

```bash
openssl rand -base64 32
```

Copy the output.

- [ ] **Step 5: Update `.env`**

Add these two lines to `/Users/vinh/Development/GigDesk/.env`:

```
ADMIN_PASSWORD_HASH=$2b$10$...paste_your_hash_here...
NEXTAUTH_SECRET=paste_your_secret_here
```

- [ ] **Step 6: Commit**

```bash
cd /Users/vinh/Development/GigDesk
git add package.json package-lock.json
git commit -m "chore: install bcryptjs and jose for admin auth"
```

---

### Task 2: Session helpers (`src/lib/session.ts`)

**Files:**
- Create: `src/lib/session.ts`

- [ ] **Step 1: Create `src/lib/session.ts`**

```ts
import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'admin-session'
const EXPIRY = '7d'

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function signSession(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

export { COOKIE_NAME }
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/session.ts
git commit -m "feat: add jose session helpers (signSession, verifySession)"
```

---

### Task 3: Login server action (`src/app/admin/login/actions.ts`)

**Files:**
- Create: `src/app/admin/login/actions.ts`

- [ ] **Step 1: Create the file**

```ts
'use server'

import { compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { signSession, COOKIE_NAME } from '@/lib/session'

export async function login(
  _prevState: { error?: string },
  formData: FormData,
): Promise<{ error: string }> {
  const password = formData.get('password')
  if (typeof password !== 'string' || !password) {
    return { error: 'Password is required' }
  }

  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) {
    console.error('[auth] ADMIN_PASSWORD_HASH is not set')
    return { error: 'Server misconfiguration' }
  }

  const valid = await compare(password, hash)
  if (!valid) {
    return { error: 'Invalid password' }
  }

  const token = await signSession()
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
  })

  redirect('/admin')
}
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/login/actions.ts
git commit -m "feat: add login server action (bcrypt compare + session cookie)"
```

---

### Task 4: Login page (`src/app/admin/login/page.tsx`)

**Files:**
- Create: `src/app/admin/login/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useActionState } from 'react'
import { login } from './actions'

const inputClass =
  'w-full rounded border border-[#ddd6cc] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#9a7a5a] focus:outline-none'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {})

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
      <div className="w-full max-w-sm px-6">
        <p className="mb-2 text-[10px] uppercase tracking-[3px] text-[#9a7a5a]">
          Admin
        </p>
        <h1 className="mb-6 text-2xl font-bold text-[#1a1a1a]">Sign in</h1>

        <form action={action} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#9a7a5a]">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className={inputClass}
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded bg-[#1a1a1a] py-2 text-sm font-semibold text-[#faf7f2] hover:bg-[#333] disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/login/page.tsx
git commit -m "feat: add /admin/login page with password form"
```

---

### Task 5: Admin placeholder page (`src/app/admin/page.tsx`)

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <p className="mb-2 text-[10px] uppercase tracking-[3px] text-[#9a7a5a]">
          Admin Dashboard
        </p>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">
          Pending Requests
        </h1>
        <p className="mt-4 text-sm text-[#888]">
          Coming in Phase 5.
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add /admin placeholder page (Phase 5 will fill content)"
```

---

### Task 6: Proxy — protect `/admin/*` routes (`proxy.ts`)

**Files:**
- Create: `proxy.ts` (at project root, same level as `src/` — NOT inside `src/`)

> **Critical:** In Next.js 16, middleware is renamed to **Proxy**. The file must be `proxy.ts` at the project root. The export must be named `proxy`. Using `middleware.ts` or exporting `middleware` will NOT work.

- [ ] **Step 1: Create `proxy.ts` at the project root**

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession, COOKIE_NAME } from './src/lib/session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page through — no auth required
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const valid = await verifySession(token)
  if (!valid) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url))
    response.cookies.delete(COOKIE_NAME)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
cd /Users/vinh/Development/GigDesk && npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: add proxy to protect /admin routes with JWT verification"
```

---

### Task 7: Build, verify, and push

- [ ] **Step 1: Run full build**

```bash
cd /Users/vinh/Development/GigDesk && npm run build
```

Expected: clean build. Routes include:
```
○ /admin
○ /admin/login
```

- [ ] **Step 2: Run lint**

```bash
cd /Users/vinh/Development/GigDesk && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Verify the happy path manually**

Start dev server: `npm run dev`

Test sequence:
1. Visit `http://localhost:3000/admin` → should redirect to `/admin/login`
2. Submit wrong password → should show "Invalid password" error (no redirect)
3. Submit correct password → should redirect to `/admin` and show placeholder page
4. Revisit `http://localhost:3000/admin` → should load directly (cookie is set)
5. Clear cookies in browser → revisit `/admin` → should redirect to `/admin/login` again

- [ ] **Step 4: Push**

```bash
git push origin main
```
