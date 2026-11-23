import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../common/auth/AuthContext'

function Avatar({ name, avatar }) {
  if (avatar) {
    return <img src={avatar} alt={name || 'User'} className="h-9 w-9 rounded-full object-cover" />
  }
  const initial = name?.trim()?.charAt(0)?.toUpperCase()
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
      {initial || <User className="h-4 w-4 text-slate-400" />}
    </div>
  )
}

// Top-right profile avatar. Clicking it opens a small menu with the signed-in
// user's email and a sign-out button. `showDetails` also renders the name and
// role beside the avatar on wider screens (used by the staff console). `links`
// ({ id, label, icon, path }[]) adds navigation items above the sign-out button.
export default function UserMenu({ showDetails = false, links = [] }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const name = user?.full_name || user?.email || ''
  const email = user?.email || ''
  const role = user?.role_label || user?.role || ''
  const avatar = user?.avatar_url || ''

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        <Avatar name={name} avatar={avatar} />
        {showDetails && (
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-900">{name || '—'}</p>
            <p className="text-xs text-slate-400">{role || 'Staff'}</p>
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Signed in as</p>
            <p className="mt-0.5 break-all text-sm font-medium text-slate-900">{email || '—'}</p>
          </div>
          {links.length > 0 && (
            <div className="border-b border-slate-100 py-1">
              {links.map(({ id, label, icon: Icon, path }) => (
                <NavLink
                  key={id}
                  to={path}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 ${
                      isActive ? 'text-emerald-700' : 'text-slate-700'
                    }`
                  }
                >
                  {Icon && <Icon className="h-4 w-4 text-slate-500" />}
                  {label}
                </NavLink>
              ))}
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4 text-slate-500" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
