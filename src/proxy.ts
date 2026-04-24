import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession, COOKIE_NAME } from './lib/session'

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
