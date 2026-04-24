'use client'

import { useActionState } from 'react'
import { login } from './actions'

const inputClass =
  'w-full rounded border border-[#ddd6cc] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#9a7a5a] focus:outline-none'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { error: '' })

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
              autoComplete="current-password"
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
