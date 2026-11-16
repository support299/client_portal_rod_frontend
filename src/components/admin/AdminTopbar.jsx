import { Menu } from 'lucide-react'
import NotificationBell from '../NotificationBell'
import UserMenu from '../UserMenu'

export default function AdminTopbar({ onMenuClick }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3 sm:gap-4">
        <NotificationBell />
        <UserMenu showDetails />
      </div>
    </header>
  )
}
