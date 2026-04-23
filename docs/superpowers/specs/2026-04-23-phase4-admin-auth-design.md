# Phase 4: Admin Auth — Design

## Decisions

- **Approach:** Custom auth — no NextAuth. bcrypt password compare + jose JWT session cookie.
- **Single admin:** No user DB. Password stored as bcrypt hash in `ADMIN_PASSWORD_HASH` env var.
- **Session:** Signed JWT (jose), 7-day expiry, httpOnly + secure + sameSite=lax cookie named `admin-session`.
- **Protection:** Next.js middleware verifies session on every `/admin/*` request (except `/admin/login`). No DB lookup per request — just JWT signature verification.

## File Structure

```
src/
  lib/
    session.ts          ← signSession(), verifySession()
  app/
    admin/
      login/
        page.tsx        ← Login page (server component shell)
        actions.ts      ← Server action: compare → set cookie → redirect
      page.tsx          ← /admin placeholder (protected)
middleware.ts           ← Protects /admin/* routes
```

## Dependencies

- `bcryptjs` + `@types/bcryptjs` — password comparison at runtime
- `jose` — JWT sign and verify

## Auth Flow

1. Request to `/admin/*` → middleware checks `admin-session` cookie
   - Missing or invalid → redirect to `/admin/login`
   - Valid → pass through
2. Login form submits password via server action
   - `bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)` 
   - Match → `signSession()` → set cookie → `redirect('/admin')`
   - No match → return error message to form
3. `/admin` renders (content built in Phase 5)

## Session Token

```
jose.SignJWT({ role: 'admin' })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('7d')
  .sign(secret)  // NEXTAUTH_SECRET as Uint8Array
```

Cookie: `admin-session`, httpOnly, secure (in prod), sameSite: lax, maxAge: 7 days.

## Env Vars

`ADMIN_PASSWORD_HASH` — bcrypt hash of admin password. Generate with:
```
node -e "require('bcryptjs').hash('yourpassword', 10).then(console.log)"
```

`NEXTAUTH_SECRET` — used as JWT signing secret. Generate with:
```
openssl rand -base64 32
```

## Out of Scope

- Logout route (can add in Phase 5 if needed)
- Session refresh / sliding expiry
- Multiple admins or roles
- OAuth / social login
