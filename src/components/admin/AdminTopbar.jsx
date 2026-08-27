import { Bell, Menu } from 'lucide-react'
import { staffUser } from '../../data/adminData'

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
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          {staffUser.notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
              {staffUser.notificationCount}
            </span>
          )}
        </button>

        <div className="hidden items-center gap-2.5 sm:flex">
          <img
            src={staffUser.avatar}
            alt={staffUser.name}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">{staffUser.name}</p>
            <p className="text-xs text-slate-400">{staffUser.role}</p>
          </div>
        </div>
        <img
          src={staffUser.avatar}
          alt={staffUser.name}
          className="h-9 w-9 rounded-full object-cover sm:hidden"
        />
      </div>
    </header>
  )
}
