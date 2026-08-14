import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import PropertySelector from '../components/PropertySelector'
import QuickActions from '../components/QuickActions'
import StatusTracker from '../components/StatusTracker'
import UrgentAction from '../components/UrgentAction'
import StatCards from '../components/StatCards'
import DealHealthBadge from '../components/DealHealthBadge'
import AssignedOfficer from '../components/AssignedOfficer'
import RecentActivity from '../components/RecentActivity'
import SectionPage from '../components/SectionPage'
import { user, properties } from '../data/dashboardData'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedProperty, setSelectedProperty] = useState(properties[0])

  const openLoanDashboard = (property) => {
    setSelectedProperty(property)
    setActiveSection('dashboard')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        activeSection={activeSection}
        onSelect={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {activeSection === 'dashboard' ? (
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-[26px] font-bold text-slate-900 sm:text-[33px]">
                    Welcome back, {user.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Here&apos;s what&apos;s happening with your loan today.
                  </p>
                </div>
                <QuickActions onNavigate={setActiveSection} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <PropertySelector selected={selectedProperty} onChange={setSelectedProperty} />
                <DealHealthBadge health={selectedProperty.health} />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <StatusTracker />
                  <UrgentAction />
                  <StatCards property={selectedProperty} />
                </div>

                <div className="space-y-6">
                  <AssignedOfficer />
                  <RecentActivity />
                </div>
              </div>
            </div>
          ) : (
            <SectionPage
              sectionId={activeSection}
              onBack={() => setActiveSection('dashboard')}
              onSelectLoan={openLoanDashboard}
            />
          )}
        </main>
      </div>

      <button
        type="button"
        aria-label="New Draw Request"
        onClick={() => setActiveSection('draw-requests')}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition-colors hover:bg-emerald-800 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
