import { ArrowLeft, Construction, ChevronRight } from 'lucide-react'
import { useAuth } from '../common/auth/AuthContext'
import { getSection } from '../common/constants/nav'
import { loanStatusStyles } from '../common/constants/uiStyles'
import DealHealthBadge from './DealHealthBadge'
import ProfileSection from './ProfileSection'
import DrawRequestsSection from './DrawRequestsSection'
import ConditionsSection from './ConditionsSection'
import DocumentCenterSection from './DocumentCenterSection'
import MarketToolsSection from './MarketToolsSection'
import TeamSection from './TeamSection'
import ResourceCenterSection from './ResourceCenterSection'
import CalendarSection from './CalendarSection'
import ChatPanel from './chat/ChatPanel'

function SectionHeader({ label, subtitle, onBack }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <button
        type="button"
        onClick={onBack}
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{label}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function MyLoansSection({ onSelectLoan, properties = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Current Loans</h2>

      {properties.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">You don&apos;t have any loans yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {properties.map((loan) => (
            <li key={loan.id}>
              <button
                type="button"
                onClick={() => onSelectLoan(loan)}
                className="flex w-full flex-col gap-4 py-4 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:rounded-lg sm:px-3"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{loan.address}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {loan.status && (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${loanStatusStyles[loan.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {loan.status}
                        </span>
                      )}
                      <DealHealthBadge health={loan.health} size="sm" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 sm:gap-8">
                  <div>
                    <p className="text-xs text-slate-400">Next Payment</p>
                    <p className="text-sm font-medium text-slate-700">{loan.nextPaymentDate ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Due</p>
                    <p className="text-sm font-medium text-slate-700">{loan.totalDue ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Est. End Date</p>
                    <p className="text-sm font-medium text-slate-700">{loan.estimatedEndDate ?? '—'}</p>
                  </div>
                </div>

                <ChevronRight className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DealTimelineSection({ dealTimeline = [] }) {
  const orderedTimeline = [...dealTimeline].reverse()

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>

      {orderedTimeline.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No timeline events yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {orderedTimeline.map((event) => (
            <li key={event.id} className="py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {event.date}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{event.title}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ComingSoonSection({ label }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Construction className="h-6 w-6" />
      </div>
      <p className="mt-4 text-base font-semibold text-slate-900">{label} coming soon</p>
      <p className="mt-1 text-sm text-slate-500">This section is under construction.</p>
    </div>
  )
}

const sectionSubtitles = {
  'my-loans': 'Many investors have multiple deals.',
  'deal-timeline': 'Borrowers love seeing progress.',
  'draw-requests': 'Huge time saver.',
  conditions: 'Every lender asks for conditions.',
  documents: 'Instead of emailing PDFs back and forth.',
  tools: 'Small widgets investors actually use.',
  'my-team': 'Instead of generic support.',
  resources: 'Great marketing opportunity.',
  messages: 'Chat with your loan team about each of your loans.',
}

export default function SectionPage({
  sectionId,
  onBack,
  onSelectLoan,
  onChangeLoan,
  onNavigate,
  loans = [],
  selectedLoan = null,
  loanDetail = null,
}) {
  const { user } = useAuth()
  const section = getSection(sectionId)
  const label = section?.label ?? 'Section'
  const subtitle = sectionSubtitles[sectionId]
  const docs = loanDetail?.documents || { documentsNeeded: [], documentsSent: [] }

  let content
  switch (sectionId) {
    case 'my-loans':
      content = <MyLoansSection onSelectLoan={onSelectLoan} properties={loans} />
      break
    case 'deal-timeline':
      content = <DealTimelineSection />
      break
    case 'documents':
      content = (
        <DocumentCenterSection
          loans={loans}
          selectedLoan={selectedLoan}
          onChangeLoan={onChangeLoan}
          userId={user?.id}
        />
      )
      break
    case 'messages':
      content = (
        <ChatPanel
          onOpenDocuments={(loanId) =>
            // Only switch to a loan the borrower has; otherwise keep the current one
            onNavigate?.('documents', loans.some((l) => l.id === loanId) ? loanId : undefined)
          }
        />
      )
      break
    case 'calendar':
      content = <CalendarSection properties={loans} />
      break
    case 'profile':
      content = <ProfileSection />
      break
    case 'draw-requests':
      content = <DrawRequestsSection properties={loans} />
      break
    case 'conditions':
      content = (
        <ConditionsSection
          conditionsList={(docs.documentsNeeded || []).map((d) => ({
            id: d.id,
            name: d.name,
            status:
              d.status === 'Uploaded'
                ? 'Complete'
                : d.status === 'Needs Revision' || d.status === 'Rejected'
                  ? 'Rejected'
                  : 'Pending',
          }))}
        />
      )
      break
    case 'tools':
      content = <MarketToolsSection />
      break
    case 'my-team':
      content = <TeamSection />
      break
    case 'resources':
      content = <ResourceCenterSection />
      break
    default:
      content = <ComingSoonSection label={label} />
  }

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeader label={label} subtitle={subtitle} onBack={onBack} />
      {content}
    </div>
  )
}
