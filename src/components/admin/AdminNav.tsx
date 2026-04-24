import Link from 'next/link'
import { logout } from '@/app/admin/actions'

export function AdminNav() {
  return (
    <div className="mb-8 flex items-center justify-between">
      <nav className="flex gap-6">
        <Link
          href="/admin"
          className="text-sm font-semibold text-[#1a1a1a] hover:text-[#9a7a5a]"
        >
          Pending Requests
        </Link>
        <Link
          href="/admin/gigs"
          className="text-sm font-semibold text-[#1a1a1a] hover:text-[#9a7a5a]"
        >
          Confirmed Gigs
        </Link>
      </nav>
      <form action={logout}>
        <button
          type="submit"
          className="text-xs text-[#9a7a5a] underline underline-offset-2 hover:text-[#1a1a1a]"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
