import { Landmark, Plus, X } from 'lucide-react'
import { navSections } from '../common/constants/nav'

function SidebarContent({ activeSection, onSelect }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight text-slate-900">Flip Funding</p>
          <p className="text-xs text-slate-400">Premier Portfolio</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {navSections.map(({ id, label, icon: Icon }) => {
            const active = id === activeSection
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-l-4 border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4">
        <button
          type="button"
          onClick={() => onSelect('draw-requests')}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" />
          New Draw Request
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ activeSection, onSelect, isOpen, onClose }) {
  const handleSelect = (id) => {
    onSelect(id)
    onClose()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent activeSection={activeSection} onSelect={handleSelect} />
        </div>
      </aside>

      {/* Mobile / tablet off-canvas sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${isOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!isOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[80%] transform bg-white shadow-xl transition-transform duration-200 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent activeSection={activeSection} onSelect={handleSelect} />
        </div>
      </div>
    </>
  )
}
