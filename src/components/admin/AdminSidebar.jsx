import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { adminNavSections } from '../../common/constants/adminNav'
import logo from '../../assets/flip-funding-logo-light.svg'

function AdminSidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="px-6 py-6">
        <img src={logo} alt="Flip Funding" className="h-12 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {adminNavSections.map(({ id, label, icon: Icon, path }) => (
            <li key={id}>
              <NavLink
                to={path}
                end={path === '/admin'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-4 border-emerald-400 bg-white/5 text-white'
                      : 'border-l-4 border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default function AdminSidebar({ isOpen, onClose }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <AdminSidebarContent />
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${isOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!isOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-900/60 transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[80%] transform shadow-xl transition-transform duration-200 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          <AdminSidebarContent onNavigate={onClose} />
        </div>
      </div>
    </>
  )
}
