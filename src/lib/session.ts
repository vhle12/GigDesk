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
