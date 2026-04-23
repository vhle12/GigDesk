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
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  redirect('/admin')
}
