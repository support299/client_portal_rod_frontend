import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminTopbar from '../components/admin/AdminTopbar'
import { adminNavSections, adminSectionSubtitles } from '../data/adminSections'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const activeSection = adminNavSections.find((s) => s.path === location.pathname)
  const subtitle = activeSection ? adminSectionSubtitles[activeSection.id] : undefined

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {activeSection && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {activeSection.label}
                </h1>
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
