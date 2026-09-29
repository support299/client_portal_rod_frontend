import { useEffect, useState } from 'react'
import { useAuth } from '../common/auth/AuthContext'
import { useLoanDetail, useMyLoans } from '../hooks/useLoans'
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
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const welcomeName = user?.full_name?.trim()
  const { loans, loading: loansLoading, error: loansError } = useMyLoans()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedProperty, setSelectedProperty] = useState(null)

  useEffect(() => {
    if (!loans.length) {
      setSelectedProperty(null)
      return
    }
    setSelectedProperty((prev) => {
      if (prev && loans.some((l) => l.id === prev.id)) {
        return loans.find((l) => l.id === prev.id) || loans[0]
      }
      return loans[0]
    })
  }, [loans])

  const { detail, loading: detailLoading } = useLoanDetail(selectedProperty?.id)

  const openLoanDashboard = (property) => {
    setSelectedProperty(property)
    setActiveSection('dashboard')
  }

  const hasLoans = loans.length > 0

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
            loansLoading ? (
              <div className="mx-auto max-w-6xl py-24 text-center text-sm text-slate-500">
                Loading your loans…
              </div>
            ) : loansError ? (
              <div className="mx-auto max-w-6xl">
                <h1 className="text-[26px] font-bold text-slate-900 sm:text-[33px]">
                  Welcome back{welcomeName ? `, ${welcomeName}` : ''}
                </h1>
                <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
                  {loansError}
                </div>
              </div>
            ) : hasLoans ? (
              <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h1 className="text-[26px] font-bold text-slate-900 sm:text-[33px]">
                      Welcome back{welcomeName ? `, ${welcomeName}` : ''}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                      Here&apos;s what&apos;s happening with your loan today.
                    </p>
                  </div>
                  <QuickActions onNavigate={setActiveSection} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <PropertySelector
                    properties={loans}
                    selected={selectedProperty}
                    onChange={setSelectedProperty}
                  />
                  {selectedProperty?.health && (
                    <DealHealthBadge health={selectedProperty.health} />
                  )}
                </div>

                {detailLoading ? (
                  <p className="mt-8 text-sm text-slate-500">Loading deal details…</p>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                      <StatusTracker
                        loanStages={detail?.loanStages}
                        currentStatus={detail?.currentStatus}
                      />
                      <UrgentAction urgentAction={detail?.urgentAction} />
                      <StatCards property={detail?.loan || selectedProperty} />
                    </div>

                    <div className="space-y-6">
                      <AssignedOfficer officer={detail?.assignedOfficer} />
                      <RecentActivity items={detail?.recentActivity || []} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto max-w-6xl">
                <h1 className="text-[26px] font-bold text-slate-900 sm:text-[33px]">
                  Welcome back{welcomeName ? `, ${welcomeName}` : ''}
                </h1>
                <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-24 text-center">
                  <p className="text-lg font-semibold text-slate-900">No loans yet</p>
                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    Sign in with the same email used on your loan application. When a matching
                    Quick App / opportunity exists, it will show here.
                  </p>
                </div>
              </div>
            )
          ) : (
            <SectionPage
              sectionId={activeSection}
              onBack={() => setActiveSection('dashboard')}
              onSelectLoan={openLoanDashboard}
              loans={loans}
              selectedLoan={selectedProperty}
              loanDetail={detail}
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
