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

  const hashB64 = process.env.ADMIN_PASSWORD_HASH
  if (!hashB64) {
    console.error('[auth] ADMIN_PASSWORD_HASH is not set')
    return { error: 'Server misconfiguration' }
  }

  // Hash is stored base64-encoded to avoid $ expansion in Next.js env loading
  const hash = Buffer.from(hashB64, 'base64').toString()
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
