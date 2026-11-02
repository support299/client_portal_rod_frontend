import { useCallback, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../common/auth/AuthContext'
import { navSections } from '../common/constants/nav'
import { useLoanDetail, useMyLoans } from '../hooks/useLoans'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { LoanTabs } from '../components/DocumentCenterSection'
import NextStep from '../components/NextStep'
import StatusTracker from '../components/StatusTracker'
import DocumentChecklist from '../components/DocumentChecklist'
import AssignedOfficer from '../components/AssignedOfficer'
import RecentActivity from '../components/RecentActivity'
import SectionPage from '../components/SectionPage'
import { ChevronRight, Plus } from 'lucide-react'

// Sections the URL may name: the sidebar's, plus ones reached from inside other sections
const knownSections = new Set([...navSections.map((s) => s.id), 'conditions', 'deal-timeline', 'my-team'])

export default function Dashboard() {
  const { user } = useAuth()
  const welcomeName = user?.full_name?.trim()
  const { loans, loading: loansLoading, error: loansError } = useMyLoans()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  // The section and the selected loan live in the URL (/documents?loan=12), so back/forward,
  // refresh and shared links all work
  const { section } = useParams()
  const activeSection = section || 'dashboard'
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const loanParam = searchParams.get('loan')
  // The loan in the URL, else the first one (also when the URL names a loan that isn't theirs)
  const selectedProperty = loans.find((l) => String(l.id) === loanParam) || loans[0] || null
  const selectedId = selectedProperty?.id

  // Go to a section, keeping the selected loan (or switching to loanId)
  const setActiveSection = useCallback(
    (id, loanId = selectedId) => {
      navigate({
        pathname: id === 'dashboard' ? '/' : `/${id}`,
        search: loanId != null ? `?loan=${loanId}` : '',
      })
    },
    [navigate, selectedId],
  )

  // Switching loans within a section replaces the history entry rather than adding one
  const setSelectedProperty = useCallback(
    (property) => {
      setSearchParams(property ? { loan: String(property.id) } : {}, { replace: true })
    },
    [setSearchParams],
  )

  const { detail, loading: detailLoading, error: detailError, reload: reloadDetail } = useLoanDetail(selectedProperty)
  const checklistRef = useRef(null)
  const showChecklist = () => checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const openLoanDashboard = (property) => setActiveSection('dashboard', property.id)

  const hasLoans = loans.length > 0

  if (section && !knownSections.has(section)) return <Navigate to="/" replace />

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
                <h1 className="text-[26px] font-bold text-slate-900 sm:text-[33px]">
                  Welcome back{welcomeName ? `, ${welcomeName}` : ''}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {loans.length > 1
                    ? `You have ${loans.length} deals with us. Pick one to see where it stands.`
                    : 'Here’s where your loan stands and what comes next.'}
                </p>

                {loans.length > 1 && (
                  <div className="mt-5">
                    <LoanTabs
                      loans={loans}
                      selectedId={selectedId}
                      onChange={setSelectedProperty}
                      refreshKey={detail?.requests}
                    />
                  </div>
                )}

                {detailError ? (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-700">
                    {detailError}{' '}
                    <button type="button" onClick={reloadDetail} className="font-semibold underline">
                      Try again
                    </button>
                  </div>
                ) : detailLoading || !detail ? (
                  <p className="mt-8 text-sm text-slate-500">Loading deal details…</p>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="min-w-0 space-y-6 lg:col-span-2">
                      <NextStep detail={detail} onNavigate={setActiveSection} onShowChecklist={showChecklist} />
                      <StatusTracker detail={detail} />
                      <DocumentChecklist
                        ref={checklistRef}
                        detail={detail}
                        userId={user?.id}
                        onChanged={reloadDetail}
                        onNavigate={setActiveSection}
                      />
                    </div>

                    <div className="space-y-6">
                      <AssignedOfficer
                        officer={detail.assignedOfficer}
                        onMessage={() => setActiveSection('messages')}
                      />
                      <RecentActivity items={detail.recentActivity} />
                      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                        <h2 className="text-base font-semibold text-slate-900">Shortcuts</h2>
                        <div className="mt-3 divide-y divide-slate-100">
                          {[
                            detail.funded && ['Request a draw', 'draw-requests'],
                            ['All my documents', 'documents'],
                            ['Rehab & ARV calculators', 'tools'],
                          ]
                            .filter(Boolean)
                            .map(([label, section]) => (
                              <button
                                key={section}
                                type="button"
                                onClick={() => setActiveSection(section)}
                                className="flex w-full items-center justify-between py-2.5 text-left text-sm font-medium text-slate-700 hover:text-emerald-700"
                              >
                                {label}
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              </button>
                            ))}
                        </div>
                      </div>
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
              onChangeLoan={setSelectedProperty}
              onNavigate={setActiveSection}
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
