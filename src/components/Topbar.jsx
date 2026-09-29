import { Link } from 'react-router-dom'
import { Bell, Settings, Menu, ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '../common/auth/AuthContext'

function UserAvatar({ name, avatar, className }) {
  if (avatar) {
    return <img src={avatar} alt={name || 'User'} className={className} />
  }
  const initial = name?.trim()?.charAt(0)?.toUpperCase() ?? ''
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 ${className}`}
      aria-hidden={!initial}
    >
      {initial || '·'}
    </div>
  )
}

export default function Topbar({ onMenuClick }) {
  const { user, isStaff, logout } = useAuth()
  const name = user?.full_name || user?.email || ''
  const avatar = user?.avatar_url || ''
  const notificationCount = 0

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

      {isStaff ? (
        <Link
          to="/admin"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:flex"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Staff Console
        </Link>
      ) : (
        <div className="hidden lg:block" />
      )}

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          aria-label="Settings"
          className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 sm:flex"
        >
          <Settings className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="Sign out"
          onClick={() => logout()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>

        <UserAvatar name={name} avatar={avatar} className="h-9 w-9 object-cover" />
      </div>
    </header>
  )
}
