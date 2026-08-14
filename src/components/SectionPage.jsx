import { ArrowLeft, Send, Construction, ChevronRight } from 'lucide-react'
import { getSection } from '../data/sections'
import {
  loanSummaries,
  messageThread,
  upcomingEvents,
  assignedOfficer,
  properties,
  loanStatusStyles,
  dealTimeline,
} from '../data/dashboardData'
import DealHealthBadge from './DealHealthBadge'
import ProfileSection from './ProfileSection'
import DrawRequestsSection from './DrawRequestsSection'
import ConditionsSection from './ConditionsSection'
import DocumentCenterSection from './DocumentCenterSection'
import MarketToolsSection from './MarketToolsSection'
import TeamSection from './TeamSection'
import ResourceCenterSection from './ResourceCenterSection'

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

function MyLoansSection({ onSelectLoan }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Current Loans</h2>

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
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${loanStatusStyles[loan.status]}`}
                    >
                      {loan.status}
                    </span>
                    <DealHealthBadge health={loan.health} size="sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                <div>
                  <p className="text-xs text-slate-400">Next Payment</p>
                  <p className="text-sm font-medium text-slate-700">{loan.nextPaymentDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Due</p>
                  <p className="text-sm font-medium text-slate-700">{loan.totalDue}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Est. End Date</p>
                  <p className="text-sm font-medium text-slate-700">{loan.estimatedEndDate}</p>
                </div>
              </div>

              <ChevronRight className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DealTimelineSection() {
  const orderedTimeline = [...dealTimeline].reverse()

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>

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
    </div>
  )
}

function LoanSummarySection() {
  return (
    <div className="space-y-6">
      {loanSummaries.map((loan) => {
        const terms = [
          { label: 'Loan Amount', value: loan.loanAmount },
          { label: 'Interest Rate', value: loan.interestRate },
          { label: 'LTV', value: loan.ltv },
          { label: 'ARV', value: loan.arv },
          { label: 'Loan Type', value: loan.loanType },
          { label: 'Term', value: loan.term },
          { label: 'Closing Date', value: loan.closingDate },
          { label: 'Maturity Date', value: loan.maturityDate },
          { label: 'Monthly Payment', value: loan.monthlyPayment },
          { label: 'Construction Holdback', value: loan.constructionHoldback },
        ]

        return (
          <div key={loan.id} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">{loan.loanName}</h2>
            <p className="text-sm text-slate-400">{loan.address}</p>

            <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {terms.map((term) => (
                <div
                  key={term.label}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 py-3"
                >
                  <dt className="text-sm text-slate-500">{term.label}</dt>
                  <dd className="text-sm font-semibold text-slate-900">{term.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )
      })}
    </div>
  )
}

function MessagesSection() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <img src={assignedOfficer.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{assignedOfficer.name}</p>
          <p className="text-xs text-slate-400">{assignedOfficer.title}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {messageThread.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[70%] ${
                msg.from === 'user'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              <p>{msg.text}</p>
              <p
                className={`mt-1 text-[11px] ${
                  msg.from === 'user' ? 'text-emerald-100' : 'text-slate-400'
                }`}
              >
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form
        className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
        />
        <button
          type="submit"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

function CalendarSection() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Upcoming Events</h2>
      <ul className="mt-4 divide-y divide-slate-100">
        {upcomingEvents.map((event) => (
          <li key={event.id} className="flex items-center justify-between gap-3 py-3">
            <p className="text-sm font-semibold text-slate-900">{event.title}</p>
            <p className="text-sm text-slate-500">
              {event.date} &middot; {event.time}
            </p>
          </li>
        ))}
      </ul>
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
  'loan-summary': 'Simple, investor-friendly overview.',
  tools: 'Small widgets investors actually use.',
  'my-team': 'Instead of generic support.',
  resources: 'Great marketing opportunity.',
}

export default function SectionPage({ sectionId, onBack, onSelectLoan }) {
  const section = getSection(sectionId)
  const label = section?.label ?? 'Section'
  const subtitle = sectionSubtitles[sectionId]

  let content
  switch (sectionId) {
    case 'my-loans':
      content = <MyLoansSection onSelectLoan={onSelectLoan} />
      break
    case 'deal-timeline':
      content = <DealTimelineSection />
      break
    case 'documents':
      content = <DocumentCenterSection />
      break
    case 'loan-summary':
      content = <LoanSummarySection />
      break
    case 'messages':
      content = <MessagesSection />
      break
    case 'calendar':
      content = <CalendarSection />
      break
    case 'profile':
      content = <ProfileSection />
      break
    case 'draw-requests':
      content = <DrawRequestsSection />
      break
    case 'conditions':
      content = <ConditionsSection />
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
