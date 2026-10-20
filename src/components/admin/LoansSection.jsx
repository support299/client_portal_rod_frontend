import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, Pencil, Phone, Search, X } from 'lucide-react'
import {
  fetchLoan,
  fetchLoanStages,
  fetchLoans,
  fetchOpportunityFilters,
  fetchUsers,
  updateLoan,
  updateOpportunity,
} from '../../api/admin'
import { useAuth } from '../../common/auth/AuthContext'
import { errorMessage } from '../../utils/errors'
import { currency, formatDate } from '../../utils/format'
import { DetailGroup, DetailRow } from './DetailList'
import LoanDocuments from './LoanDocuments'

const PAGE_SIZE = 25

function personName(user) {
  return user?.full_name?.trim() || user?.email || null
}

function formatAmount(value) {
  const amount = Number(value)
  return amount ? currency.format(amount) : null
}

function StatusBadge({ loan }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      {loan.status_label || loan.stage_name || loan.status}
    </span>
  )
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none'

// A loan can have several officers; older responses only carry the first as loan_officer
function officersOf(loan) {
  return loan.loan_officers ?? (loan.loan_officer ? [loan.loan_officer] : [])
}

// The officer who is the opportunity's assigned user in GHL; the API lists them first
function ghlAssigneeOf(loan) {
  return officersOf(loan).find((o) => o.is_ghl_assignee)
}

function GhlBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-indigo-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-indigo-700">
      Main · GHL
    </span>
  )
}

function LoanDetails({ loan }) {
  const { borrower } = loan
  const officers = officersOf(loan)

  return (
    <div className="space-y-6">
      <DetailGroup title="Loan">
        <DetailRow label="Amount">{formatAmount(loan.loan_amount)}</DetailRow>
        <DetailRow label="Status">
          <StatusBadge loan={loan} />
        </DetailRow>
        <DetailRow label="Expected close">{formatDate(loan.expected_close_date)}</DetailRow>
        <DetailRow label="Team">
          {officers.length > 0 && (
            <>
              {officers.map((officer) => (
                <span key={officer.id} className="block">
                  {personName(officer)}
                  {officer.is_ghl_assignee && <GhlBadge />}
                  {officer.full_name?.trim() && <span className="block text-xs font-normal text-slate-400">{officer.email}</span>}
                </span>
              ))}
            </>
          )}
        </DetailRow>
      </DetailGroup>

      <DetailGroup title="Borrower">
        <DetailRow label="Name">{borrower?.full_name?.trim()}</DetailRow>
        <DetailRow label="Email">
          {borrower?.email && (
            <a href={`mailto:${borrower.email}`} className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline">
              <Mail className="h-3.5 w-3.5" />
              {borrower.email}
            </a>
          )}
        </DetailRow>
        <DetailRow label="Phone">
          {borrower?.phone && (
            <a
              href={`tel:${borrower.phone.replace(/[^\d+]/g, '')}`}
              className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {borrower.phone}
            </a>
          )}
        </DetailRow>
      </DetailGroup>

      <DetailGroup title="CRM (copied at conversion)">
        <DetailRow label="Pipeline">{loan.pipeline_name}</DetailRow>
        <DetailRow label="Stage">{loan.stage_name}</DetailRow>
        <DetailRow label="Opportunity status">
          {loan.opportunity_status && <span className="capitalize">{loan.opportunity_status}</span>}
        </DetailRow>
        <DetailRow label="Source">{loan.source}</DetailRow>
        <DetailRow label="Assigned to (GHL)">{loan.assigned_to}</DetailRow>
        <DetailRow label="Lost reason ID">{loan.lost_reason_id}</DetailRow>
        <DetailRow label="Opportunity ID">{loan.opportunity}</DetailRow>
        <DetailRow label="Contact ID">{loan.contact}</DetailRow>
        <DetailRow label="Location ID">{loan.location_id}</DetailRow>
      </DetailGroup>

      <DetailGroup title="Record">
        <DetailRow label="Created">{formatDate(loan.created_at, true)}</DetailRow>
        <DetailRow label="Last updated">{formatDate(loan.updated_at, true)}</DetailRow>
        <DetailRow label="Created by">{loan.created_by != null && `User #${loan.created_by}`}</DetailRow>
      </DetailGroup>
    </div>
  )
}

function formFromLoan(loan) {
  return {
    name: loan.name ?? '',
    loan_amount: loan.loan_amount ?? '',
    opportunity_status: loan.opportunity_status ?? '',
    pipeline_stage_id: loan.pipeline_stage_id ?? '',
    expected_close_date: loan.expected_close_date ?? '',
    lost_reason_id: loan.lost_reason_id ?? '',
    loan_officers: officersOf(loan).map((u) => String(u.id)).sort(),
    // The main team member is the opportunity's assigned user in GHL
    main_officer: String(ghlAssigneeOf(loan)?.id ?? ''),
  }
}

// Fields the GHL opportunity update accepts (the pipeline itself can't be changed here)
function EditLoanForm({ loan, stages, canReassign, onCancel, onSaved, onSavingChange }) {
  const [original] = useState(() => formFromLoan(loan))
  const [form, setForm] = useState(original)
  const [statuses, setStatuses] = useState([])
  const [officers, setOfficers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState(false)

  // Opportunity status options
  useEffect(() => {
    let cancelled = false
    fetchOpportunityFilters()
      .then((data) => {
        if (cancelled) return
        setStatuses(data?.statuses ?? [])
      })
      .catch(() => !cancelled && setError('Could not load status options.'))
    return () => {
      cancelled = true
    }
  }, [])

  // Any active non-borrower can be the loan officer (matches LoanUpdateSerializer)
  useEffect(() => {
    if (!canReassign) return
    let cancelled = false
    fetchUsers({ is_active: 'true', page_size: 100 })
      .then((data) => {
        if (cancelled) return
        const staff = (data?.results ?? []).filter((u) => u.role !== 'borrower')
        // Keep current officers selectable even if they are no longer in the active staff list
        const missing = officersOf(loan).filter((c) => !staff.some((u) => u.id === c.id))
        setOfficers([...missing, ...staff])
      })
      .catch(() => !cancelled && setError('Could not load loan officers.'))
    return () => {
      cancelled = true
    }
  }, [canReassign, loan])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function toggleOfficer(id) {
    setForm((f) => ({
      ...f,
      loan_officers: f.loan_officers.includes(id)
        ? f.loan_officers.filter((x) => x !== id)
        : [...f.loan_officers, id].sort(),
    }))
  }

  // Making someone main also adds them to the team
  function makeMain(id) {
    setForm((f) => ({
      ...f,
      main_officer: id,
      loan_officers: f.loan_officers.includes(id) ? f.loan_officers : [...f.loan_officers, id].sort(),
    }))
  }

  const personLabel = (id) => {
    const match = [...officersOf(loan), ...officers].find((u) => String(u.id) === String(id))
    return match ? personName(match) : `User #${id}`
  }
  const officersLabel = (ids) => (ids.length ? ids.map(personLabel).join(', ') : 'Unassigned')
  const fieldDisplay = {
    name: ['Name', (v) => v || '—'],
    loan_amount: ['Loan amount', (v) => formatAmount(v) || '$0'],
    opportunity_status: ['Opportunity status', (v) => statuses.find((s) => s.value === v)?.label ?? (v || '—')],
    pipeline_stage_id: ['Stage', (v) => stages.find((s) => s.id === v)?.name ?? (v || '—')],
    expected_close_date: ['Expected close', (v) => formatDate(v) || 'Not set'],
    lost_reason_id: ['Lost reason ID', (v) => v || '—'],
    loan_officers: ['Team', officersLabel],
    main_officer: ['Main (assigned in GHL)', (v) => (v ? personLabel(v) : 'None')],
  }
  const adminOnly = ['loan_officers', 'main_officer']
  // What the admin is about to change, shown on the review step
  const changes = Object.entries(fieldDisplay)
    .filter(([key]) => (!adminOnly.includes(key) || canReassign) && String(form[key]) !== String(original[key]))
    .map(([key, [label, show]]) => ({ key, label, from: show(original[key]), to: show(form[key]) }))

  function handleReview(e) {
    e.preventDefault()
    setError('')
    setReviewing(true)
  }

  async function handleAccept() {
    const changed = (key) => changes.some((c) => c.key === key)
    // Everything GHL accepts goes through the opportunity update; the team lives on the loan,
    // and the loan update pushes the main member to GHL as the assigned user
    const opportunityPayload = {}
    if (changed('name')) opportunityPayload.name = form.name
    if (changed('loan_amount')) opportunityPayload.monetary_value = form.loan_amount === '' ? '0' : String(form.loan_amount)
    if (changed('opportunity_status')) opportunityPayload.status = form.opportunity_status
    if (changed('pipeline_stage_id')) opportunityPayload.pipeline_stage_id = form.pipeline_stage_id
    if (changed('expected_close_date')) opportunityPayload.expected_close_date = form.expected_close_date || null
    if (changed('lost_reason_id')) opportunityPayload.lost_reason_id = form.lost_reason_id
    const loanPayload = {}
    if (changed('loan_officers')) loanPayload.loan_officers = form.loan_officers.map(Number)
    if (changed('main_officer')) loanPayload.main_officer = Number(form.main_officer)

    setSaving(true)
    onSavingChange(true)
    setError('')
    let opportunitySaved = false
    try {
      if (Object.keys(opportunityPayload).length) {
        await updateOpportunity(loan.opportunity, opportunityPayload)
        opportunitySaved = true
      }
      const saved = Object.keys(loanPayload).length
        ? await updateLoan(loan.id, loanPayload)
        : await fetchLoan(loan.id)
      onSaved(saved)
    } catch (err) {
      const prefix = opportunitySaved ? 'The opportunity changes were saved, but the team was not: ' : ''
      setError(prefix + errorMessage(err))
    } finally {
      setSaving(false)
      onSavingChange(false)
    }
  }

  if (reviewing) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Review your changes. Nothing is saved until you accept.</p>
        {changes.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">No changes were made.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {changes.map((c) => (
              <li key={c.key} className="grid grid-cols-1 gap-1 px-4 py-3 text-sm sm:grid-cols-3 sm:gap-3">
                <span className="font-medium text-slate-500">{c.label}</span>
                <span className="text-slate-400 line-through">{c.from}</span>
                <span className="font-semibold text-slate-900">{c.to}</span>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setReviewing(false)}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={saving || changes.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Accept & Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleReview} className="space-y-4">
      <div>
        <label htmlFor="loan-name" className="text-xs font-medium text-slate-500">Name</label>
        <input id="loan-name" name="name" value={form.name} onChange={handleChange} className={inputClass} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="loan-stage" className="text-xs font-medium text-slate-500">Stage</label>
          <select id="loan-stage" name="pipeline_stage_id" value={form.pipeline_stage_id} onChange={handleChange} className={inputClass}>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="loan-opp-status" className="text-xs font-medium text-slate-500">Opportunity Status</label>
          <select
            id="loan-opp-status"
            name="opportunity_status"
            value={form.opportunity_status}
            onChange={handleChange}
            className={inputClass}
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="loan-amount" className="text-xs font-medium text-slate-500">Loan Amount ($)</label>
          <input
            id="loan-amount"
            name="loan_amount"
            type="number"
            min="0"
            step="0.01"
            value={form.loan_amount}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="loan-close" className="text-xs font-medium text-slate-500">Expected Close Date</label>
          <input
            id="loan-close"
            name="expected_close_date"
            type="date"
            value={form.expected_close_date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="loan-lost" className="text-xs font-medium text-slate-500">Lost Reason ID</label>
        <input id="loan-lost" name="lost_reason_id" value={form.lost_reason_id} onChange={handleChange} className={inputClass} />
      </div>
      {canReassign ? (
        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-xs font-semibold text-slate-500">
            Team ({form.loan_officers.length} selected)
          </legend>
          <p className="mb-2 text-xs text-slate-400">
            The main member is the assigned user in GHL. Only members with a GHL user can be main.
          </p>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {officers.map((u) => {
              const id = String(u.id)
              // The main member always stays on the team; make someone else main to remove them
              const isMain = id === form.main_officer
              return (
                <div
                  key={u.id}
                  className={`flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm text-slate-700 ${isMain ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <input
                    id={`team-${id}`}
                    type="checkbox"
                    checked={isMain || form.loan_officers.includes(id)}
                    disabled={isMain}
                    onChange={() => toggleOfficer(id)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor={`team-${id}`} className={`flex-1 ${isMain ? 'font-medium' : 'cursor-pointer'}`}>
                    {personName(u)}
                    {u.role_label && <span className="font-normal text-slate-400">{` (${u.role_label})`}</span>}
                  </label>
                  {isMain ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                      Main · GHL
                    </span>
                  ) : u.ghl_user_id ? (
                    <button
                      type="button"
                      onClick={() => makeMain(id)}
                      className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-700"
                    >
                      Make main
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-300" title="Not linked to a GHL user">No GHL user</span>
                  )}
                </div>
              )
            })}
            {officers.length === 0 && <p className="text-xs text-slate-400">Loading team members…</p>}
          </div>
        </fieldset>
      ) : (
        <p className="text-xs text-slate-500">
          Team:{' '}
          <span className="font-medium text-slate-700">{officersLabel(original.loan_officers)}</span>
          {original.main_officer && <> &middot; main: <span className="font-medium text-slate-700">{personLabel(original.main_officer)}</span></>}
          {' '}&middot; only admins can reassign.
        </p>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Review Changes
        </button>
      </div>
    </form>
  )
}

const panelTabs = [
  { id: 'details', label: 'Details' },
  { id: 'documents', label: 'Documents' },
]

function LoanPanel({ loan, stages, mode, canReassign, onModeChange, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('details')
  const close = () => !saving && onClose()

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && !saving && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={loan.name || `Loan #${loan.id}`}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              {mode === 'edit' ? 'Edit ' : ''}
              {loan.name || `Loan #${loan.id}`}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <StatusBadge loan={loan} />
              <span>Loan #{loan.id}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {mode === 'view' && tab === 'details' && (
              <button
                type="button"
                onClick={() => onModeChange('edit')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {mode === 'view' && (
          <div role="tablist" className="flex gap-1 border-b border-slate-200 px-5 sm:px-6">
            {panelTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold ${
                  tab === t.id
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {mode === 'view' && tab === 'documents' ? (
            <LoanDocuments loanId={loan.id} />
          ) : mode === 'edit' ? (
            <EditLoanForm
              loan={loan}
              stages={stages}
              canReassign={canReassign}
              onCancel={() => onModeChange('view')}
              onSavingChange={setSaving}
              onSaved={(saved) => {
                onSaved(saved)
                onModeChange('view')
              }}
            />
          ) : (
            <LoanDetails loan={loan} />
          )}
        </div>
      </aside>
    </div>
  )
}

// The loan panel for one loan by id, for pages outside this list (e.g. a loan's chat on Messages)
export function LoanModal({ loanId, onClose }) {
  const [loan, setLoan] = useState(null)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('view')
  const [stages, setStages] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    let cancelled = false
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

  if (!loan) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
        <div className="rounded-2xl bg-white px-6 py-5 text-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
          {error ? (
            <div className="flex items-center gap-3">
              <span className="text-red-600">{error}</span>
              <button type="button" onClick={onClose} className="font-semibold text-slate-600 hover:underline">
                Close
              </button>
            </div>
          ) : (
            <span className="text-slate-500">Loading loan…</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <LoanPanel
      loan={loan}
      stages={stages}
      mode={mode}
      canReassign={user?.role === 'admin'}
      onModeChange={setMode}
      onClose={onClose}
      onSaved={setLoan}
    />
  )
}

export default function LoansSection() {
  const [loans, setLoans] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  // ?search= lets other sections (e.g. Borrowers) link to a filtered loan list
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') ?? ''
  const [query, setQuery] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [panelMode, setPanelMode] = useState('view')
  const [stages, setStages] = useState([])
  const { user } = useAuth()
  const canReassign = user?.role === 'admin'

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const selectedLoan = loans.find((l) => l.id === selectedId)

  function openLoan(loan, mode = 'view') {
    setSelectedId(loan.id)
    setPanelMode(mode)
  }

  // A loan's status is a stage of the loan pipeline; used by the status filter and the edit form
  useEffect(() => {
    fetchLoanStages()
      .then((data) => setStages(Array.isArray(data) ? data : []))
      .catch(() => setStages([]))
  }, [])

  // Debounce the search box; a new search starts from the first page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchLoans({ search, status, page, page_size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        setLoans(data?.results ?? [])
        setCount(data?.count ?? 0)
      })
      .catch((err) => !cancelled && setError(err.message || 'Failed to load loans'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [search, status, page])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search loan name or borrower email"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by status"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All statuses</option>
          {stages.map(({ id, name }) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading && loans.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Loading loans…</p>
      ) : loans.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {search || status
            ? 'No loans match these filters.'
            : 'No loans yet. Convert an opportunity from the Pipeline to create one.'}
        </p>
      ) : (
        <div className={`-mx-5 mt-4 overflow-x-auto sm:-mx-6 ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5 font-medium sm:px-6">Loan</th>
                <th className="px-3 py-2.5 font-medium">Borrower</th>
                <th className="px-3 py-2.5 font-medium">Team</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Expected Close</th>
                <th className="px-3 py-2.5 font-medium">Created</th>
                <th className="px-5 py-2.5 sm:px-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.map((loan) => (
                <tr key={loan.id} onClick={() => openLoan(loan)} className="cursor-pointer align-top hover:bg-slate-50">
                  <td className="px-5 py-3 sm:px-6">
                    {/* A real button so the row can be opened from the keyboard */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openLoan(loan)
                      }}
                      className="text-left font-semibold text-slate-900 hover:text-emerald-700 focus:outline-none focus-visible:underline"
                    >
                      {loan.name || `Loan #${loan.id}`}
                    </button>
                    <p className="text-xs text-slate-400">
                      #{loan.id}
                      {loan.stage_name ? ` · ${loan.stage_name}` : ''}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-slate-900">{personName(loan.borrower) || '—'}</p>
                    {loan.borrower?.full_name?.trim() && <p className="text-xs text-slate-400">{loan.borrower.email}</p>}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {officersOf(loan).length
                      ? officersOf(loan).map((o, i) => (
                          <span key={o.id} className={o.is_ghl_assignee ? 'font-medium text-slate-900' : undefined}>
                            {i > 0 && ', '}
                            {personName(o)}
                            {o.is_ghl_assignee && <GhlBadge />}
                          </span>
                        ))
                      : 'Unassigned'}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900">{formatAmount(loan.loan_amount) || '—'}</td>
                  <td className="px-3 py-3">
                    <StatusBadge loan={loan} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDate(loan.expected_close_date) || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDate(loan.created_at) || '—'}</td>
                  <td className="px-5 py-2 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openLoan(loan, 'edit')
                      }}
                      aria-label={`Edit ${loan.name || `loan #${loan.id}`}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {count > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>
            {count} loan{count === 1 ? '' : 's'} &middot; Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount || loading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedLoan && (
        <LoanPanel
          loan={selectedLoan}
          stages={stages}
          mode={panelMode}
          canReassign={canReassign}
          onModeChange={setPanelMode}
          onClose={() => setSelectedId(null)}
          onSaved={(saved) => setLoans((list) => list.map((l) => (l.id === saved.id ? saved : l)))}
        />
      )}
    </div>
  )
}
