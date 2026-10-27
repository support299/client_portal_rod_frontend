import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, MessageSquare, Pencil, Phone, X } from 'lucide-react'
import { fetchLoan, fetchLoanStages } from '../../api/admin'
import { fetchLoanChat } from '../../api/chats'
import { useAuth } from '../../common/auth/AuthContext'
import { money } from '../../utils/draws'
import { errorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { DetailGroup, DetailRow } from './DetailList'
import LoanDocuments from './LoanDocuments'
import LoanDraws from './LoanDraws'
import LoanNotes from './LoanNotes'
import { EditLoanForm, StatusBadge } from './LoansSection'

// In-page sections, in order; /admin/loans/12#draws scrolls to one
const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'draws', label: 'Draws' },
  { id: 'documents', label: 'Documents' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'notes', label: 'Notes' },
]

const card = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6'

function personName(user) {
  return user?.full_name?.trim() || user?.email || null
}

function ContactCard({ person, label, badge }) {
  if (!person) return null
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
        {personName(person)?.charAt(0)?.toUpperCase() ?? '·'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          {personName(person)}
          {badge && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-indigo-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-indigo-700">
              {badge}
            </span>
          )}
        </p>
        <p className="text-xs text-slate-400">{label}</p>
        <div className="mt-1.5 space-y-1 text-sm">
          {person.email && (
            <a href={`mailto:${person.email}`} className="flex items-center gap-1.5 break-all text-emerald-700 hover:underline">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {person.email}
            </a>
          )}
          {person.phone && (
            <a
              href={`tel:${person.phone.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-1.5 text-emerald-700 hover:underline"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {person.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, action, children }) {
  return (
    <section id={id} className={`${card} scroll-mt-20`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Everything about one loan for staff: details, draws, documents and the people on it. */
export default function LoanPage() {
  const { loanId } = useParams()
  const { hash } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loan, setLoan] = useState(null)
  const [stages, setStages] = useState([])
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [chatError, setChatError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoan(null)
    setError('')
    fetchLoan(loanId)
      .then((data) => !cancelled && setLoan(data))
      .catch((err) => !cancelled && setError(errorMessage(err)))
    fetchLoanStages()
      .then((data) => !cancelled && setStages(Array.isArray(data) ? data : []))
      .catch(() => !cancelled && setStages([]))
    return () => {
      cancelled = true
    }
  }, [loanId])

  // Scroll to #section once the page has content to scroll to
  useEffect(() => {
    if (!loan || !hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loan, hash])

  async function openChat() {
    setChatError('')
    try {
      const chat = await fetchLoanChat(loan.id)
      navigate(`/admin/notes?chat=${chat.id}`)
    } catch (err) {
      setChatError(errorMessage(err))
    }
  }

  if (!loan) {
    return (
      <div className={`${card} text-center text-sm`}>
        {error ? (
          <>
            <p className="text-red-600">{error}</p>
            <Link to="/admin/loans" className="mt-3 inline-block font-semibold text-emerald-700 hover:text-emerald-800">
              Back to Loans
            </Link>
          </>
        ) : (
          <p className="text-slate-500">Loading loan…</p>
        )}
      </div>
    )
  }

  const officers = loan.loan_officers ?? (loan.loan_officer ? [loan.loan_officer] : [])
  const facts = [
    ['Loan amount', money(loan.loan_amount)],
    ['Holdback', money(loan.holdback_amount)],
    ['Expected close', formatDate(loan.expected_close_date) || '—'],
    ['Created', formatDate(loan.created_at) || '—'],
  ]

  return (
    <div className="space-y-6">
      <Link
        to="/admin/loans"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Loans
      </Link>

      <header id="overview" className={`${card} scroll-mt-20`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{loan.name || `Loan #${loan.id}`}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <StatusBadge loan={loan} />
              <span>Loan #{loan.id}</span>
              {loan.pipeline_name && <span>&middot; {loan.pipeline_name}</span>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openChat}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Loan chat
            </button>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>
        {chatError && <p className="mt-3 text-sm text-red-600">{chatError}</p>}

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>

        {editing && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Edit loan</h2>
              <button
                type="button"
                onClick={() => !saving && setEditing(false)}
                aria-label="Close edit form"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <EditLoanForm
              loan={loan}
              stages={stages}
              canReassign={user?.role === 'admin'}
              onCancel={() => setEditing(false)}
              onSavingChange={setSaving}
              onSaved={(saved) => {
                setLoan(saved)
                setEditing(false)
              }}
            />
          </div>
        )}
      </header>

      <nav aria-label="Loan sections" className="-mx-1 flex gap-2 overflow-x-auto px-1">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault()
              navigate({ hash: s.id }, { replace: true })
              document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
              hash === `#${s.id}` ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Section id="draws" title="Draw Requests">
            <LoanDraws loanId={loan.id} />
          </Section>

          <Section id="documents" title="Documents">
            <LoanDocuments loanId={loan.id} />
          </Section>
        </div>

        <div className="min-w-0 space-y-6">
          <Section id="contacts" title="Contacts">
            <div className="divide-y divide-slate-100">
              <ContactCard person={loan.borrower} label="Borrower" />
              {officers.map((officer) => (
                <ContactCard
                  key={officer.id}
                  person={officer}
                  label={officer.role_label || 'Loan team'}
                  badge={officer.is_ghl_assignee ? 'Main · GHL' : null}
                />
              ))}
              {officers.length === 0 && <p className="py-3 text-sm text-slate-400">No one on the loan team yet.</p>}
            </div>
          </Section>

          <Section id="notes" title="Internal Notes">
            <LoanNotes loanId={loan.id} />
          </Section>

          <section className={card}>
            <div className="space-y-6">
              <DetailGroup title="CRM">
                <DetailRow label="Pipeline">{loan.pipeline_name}</DetailRow>
                <DetailRow label="Stage">{loan.stage_name}</DetailRow>
                <DetailRow label="Opportunity status">
                  {loan.opportunity_status && <span className="capitalize">{loan.opportunity_status}</span>}
                </DetailRow>
                <DetailRow label="Source">{loan.source}</DetailRow>
                <DetailRow label="Lost reason ID">{loan.lost_reason_id}</DetailRow>
                <DetailRow label="Opportunity ID">{loan.opportunity}</DetailRow>
                <DetailRow label="Contact ID">{loan.contact}</DetailRow>
                <DetailRow label="Location ID">{loan.location_id}</DetailRow>
              </DetailGroup>
              <DetailGroup title="Record">
                <DetailRow label="Created">{formatDate(loan.created_at, true)}</DetailRow>
                <DetailRow label="Last updated">{formatDate(loan.updated_at, true)}</DetailRow>
              </DetailGroup>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
