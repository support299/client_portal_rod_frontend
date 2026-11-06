import { Link } from 'react-router-dom'
import { Settings, Menu, ShieldCheck, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '../common/auth/AuthContext'
import NotificationBell from './NotificationBell'

// Shown to brokers on every portal page: which client's account they're viewing
function ClientPicker({ clients, selectedClient, onSelectClient }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
        <UserRound className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Viewing client</p>
        <select
          value={selectedClient?.id ?? ''}
          onChange={(e) => onSelectClient(e.target.value)}
          aria-label="Viewing client"
          className="-ml-1 w-full max-w-[14rem] truncate rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus:outline-none"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name?.trim() || c.email}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

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

export default function Topbar({ onMenuClick, clients, selectedClient, onSelectClient }) {
  const { user, isStaff, logout } = useAuth()
  const name = user?.full_name || user?.email || ''
  const avatar = user?.avatar_url || ''

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {clients?.length > 0 ? (
        <ClientPicker clients={clients} selectedClient={selectedClient} onSelectClient={onSelectClient} />
      ) : isStaff ? (
        <Link
          to="/admin/tasks"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:flex"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Staff Console
        </Link>
      ) : (
        <div className="hidden lg:block" />
      )}

      <div className="flex items-center gap-3 sm:gap-4">
        <NotificationBell />

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
