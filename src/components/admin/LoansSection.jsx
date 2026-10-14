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
import { currency, customFieldValue, formatDate } from '../../utils/format'
import { DetailGroup, DetailRow } from './DetailList'

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

// DRF returns { field: [messages] }; show the first one with its field name
function errorMessage(err) {
  const data = err?.data
  if (data && typeof data === 'object' && !data.detail) {
    const [field, messages] = Object.entries(data)[0] ?? []
    const message = Array.isArray(messages) ? messages[0] : messages
    if (message) return field === 'non_field_errors' ? message : `${field.replace(/_/g, ' ')}: ${message}`
  }
  return err?.message || 'Request failed'
}

// A loan can have several officers; older responses only carry the first as loan_officer
function officersOf(loan) {
  return loan.loan_officers ?? (loan.loan_officer ? [loan.loan_officer] : [])
}

function LoanDetails({ loan }) {
  const { borrower } = loan
  const officers = officersOf(loan)
  const customFields = (Array.isArray(loan.custom_fields) ? loan.custom_fields : [])
    .map((field) => ({ id: field.id, value: customFieldValue(field) }))
    .filter((field) => field.value)

  return (
    <div className="space-y-6">
      <DetailGroup title="Loan">
        <DetailRow label="Amount">{formatAmount(loan.loan_amount)}</DetailRow>
        <DetailRow label="Status">
          <StatusBadge loan={loan} />
        </DetailRow>
        <DetailRow label="Expected close">{formatDate(loan.expected_close_date)}</DetailRow>
        <DetailRow label={officers.length > 1 ? 'Loan officers' : 'Loan officer'}>
          {officers.length > 0 && (
            <>
              {officers.map((officer) => (
                <span key={officer.id} className="block">
                  {personName(officer)}
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

      {customFields.length > 0 && (
        <DetailGroup title="Custom fields">
          {customFields.map((field) => (
            <DetailRow key={field.id} label={<span className="font-mono text-xs">{field.id}</span>}>
              {field.value}
            </DetailRow>
          ))}
        </DetailGroup>
      )}
    </div>
  )
}

function customFieldList(loan) {
  return Array.isArray(loan.custom_fields) ? loan.custom_fields : []
}

function formFromLoan(loan) {
  return {
    name: loan.name ?? '',
    loan_amount: loan.loan_amount ?? '',
    opportunity_status: loan.opportunity_status ?? '',
    pipeline_stage_id: loan.pipeline_stage_id ?? '',
    expected_close_date: loan.expected_close_date ?? '',
    assigned_to: loan.assigned_to ?? '',
    lost_reason_id: loan.lost_reason_id ?? '',
    loan_officers: officersOf(loan).map((u) => String(u.id)).sort(),
    custom: Object.fromEntries(customFieldList(loan).map((f) => [f.id, customFieldValue(f) ?? ''])),
  }
}

// Fields the GHL opportunity update accepts (the pipeline itself can't be changed here)
function EditLoanForm({ loan, stages, canReassign, onCancel, onSaved, onSavingChange }) {
  const [original] = useState(() => formFromLoan(loan))
  const [form, setForm] = useState(original)
  const [statuses, setStatuses] = useState([])
  const [assignees, setAssignees] = useState([])
  const [officers, setOfficers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState(false)

  // Opportunity status options and the GHL users an opportunity can be assigned to
  useEffect(() => {
    let cancelled = false
    fetchOpportunityFilters()
      .then((data) => {
        if (cancelled) return
        setStatuses(data?.statuses ?? [])
        setAssignees(data?.assigned_to ?? [])
      })
      .catch(() => !cancelled && setError('Could not load status and assignee options.'))
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

  const officersLabel = (ids) => {
    if (!ids.length) return 'Unassigned'
    return ids
      .map((id) => {
        const match = [...officersOf(loan), ...officers].find((u) => String(u.id) === String(id))
        return match ? personName(match) : `User #${id}`
      })
      .join(', ')
  }
  const fieldDisplay = {
    name: ['Name', (v) => v || '—'],
    loan_amount: ['Loan amount', (v) => formatAmount(v) || '$0'],
    opportunity_status: ['Opportunity status', (v) => statuses.find((s) => s.value === v)?.label ?? (v || '—')],
    pipeline_stage_id: ['Stage', (v) => stages.find((s) => s.id === v)?.name ?? (v || '—')],
    expected_close_date: ['Expected close', (v) => formatDate(v) || 'Not set'],
    assigned_to: ['Assigned to (GHL)', (v) => assignees.find((u) => u.user_id === v)?.name ?? (v || 'Unassigned')],
    lost_reason_id: ['Lost reason ID', (v) => v || '—'],
    loan_officers: ['Loan officers', officersLabel],
  }
  const adminOnly = ['assigned_to', 'loan_officers']
  // What the admin is about to change, shown on the review step
  const changes = [
    ...Object.entries(fieldDisplay)
      .filter(([key]) => (!adminOnly.includes(key) || canReassign) && String(form[key]) !== String(original[key]))
      .map(([key, [label, show]]) => ({ key, label, from: show(original[key]), to: show(form[key]) })),
    ...Object.keys(form.custom)
      .filter((id) => form.custom[id] !== original.custom[id])
      .map((id) => ({
        key: `custom:${id}`,
        label: `Custom field ${id}`,
        from: original.custom[id] || '—',
        to: form.custom[id] || '—',
      })),
  ]

  function handleReview(e) {
    e.preventDefault()
    setError('')
    setReviewing(true)
  }

  async function handleAccept() {
    const changed = (key) => changes.some((c) => c.key === key)
    // Everything GHL accepts goes through the opportunity update; the loan officer lives on the loan
    const opportunityPayload = {}
    if (changed('name')) opportunityPayload.name = form.name
    if (changed('loan_amount')) opportunityPayload.monetary_value = form.loan_amount === '' ? '0' : String(form.loan_amount)
    if (changed('opportunity_status')) opportunityPayload.status = form.opportunity_status
    if (changed('pipeline_stage_id')) opportunityPayload.pipeline_stage_id = form.pipeline_stage_id
    if (changed('expected_close_date')) opportunityPayload.expected_close_date = form.expected_close_date || null
    if (changed('assigned_to')) opportunityPayload.assigned_to = form.assigned_to
    if (changed('lost_reason_id')) opportunityPayload.lost_reason_id = form.lost_reason_id
    const customChanges = Object.keys(form.custom)
      .filter((id) => changed(`custom:${id}`))
      .map((id) => ({ id, field_value: form.custom[id] }))
    if (customChanges.length) opportunityPayload.custom_fields = customChanges

    setSaving(true)
    onSavingChange(true)
    setError('')
    let opportunitySaved = false
    try {
      if (Object.keys(opportunityPayload).length) {
        await updateOpportunity(loan.opportunity, opportunityPayload)
        opportunitySaved = true
      }
      const saved = changed('loan_officers')
        ? await updateLoan(loan.id, { loan_officers: form.loan_officers.map(Number) })
        : await fetchLoan(loan.id)
      onSaved(saved)
    } catch (err) {
      const prefix = opportunitySaved ? 'The opportunity changes were saved, but the loan officer was not: ' : ''
      setError(prefix + errorMessage(err))
      setError(errorMessage(err))
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
      {canReassign ? (
        <div>
          <label htmlFor="loan-assigned" className="text-xs font-medium text-slate-500">Assigned To (GHL)</label>
          <select id="loan-assigned" name="assigned_to" value={form.assigned_to} onChange={handleChange} className={inputClass}>
            {!form.assigned_to && <option value="">Unassigned</option>}
            {assignees.map((u) => (
              <option key={u.user_id} value={u.user_id}>{u.name || u.email}</option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Assigned to (GHL): <span className="font-medium text-slate-700">{loan.assigned_to || 'Unassigned'}</span>
          {' '}&middot; only admins can reassign.
        </p>
      )}
      <div>
        <label htmlFor="loan-lost" className="text-xs font-medium text-slate-500">Lost Reason ID</label>
        <input id="loan-lost" name="lost_reason_id" value={form.lost_reason_id} onChange={handleChange} className={inputClass} />
      </div>
      {Object.keys(form.custom).length > 0 && (
        <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-xs font-semibold text-slate-500">Custom fields</legend>
          {Object.keys(form.custom).map((id) => (
            <div key={id}>
              <label htmlFor={`loan-cf-${id}`} className="font-mono text-xs text-slate-500">{id}</label>
              <input
                id={`loan-cf-${id}`}
                value={form.custom[id]}
                onChange={(e) => setForm((f) => ({ ...f, custom: { ...f.custom, [id]: e.target.value } }))}
                className={inputClass}
              />
            </div>
          ))}
        </fieldset>
      )}
      {canReassign ? (
        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-xs font-semibold text-slate-500">
            Loan Officers ({form.loan_officers.length} selected)
          </legend>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {officers.map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={form.loan_officers.includes(String(u.id))}
                  onChange={() => toggleOfficer(String(u.id))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  {personName(u)}
                  {u.role_label && <span className="text-slate-400">{` (${u.role_label})`}</span>}
                </span>
              </label>
            ))}
            {officers.length === 0 && <p className="text-xs text-slate-400">Loading team members…</p>}
          </div>
        </fieldset>
      ) : (
        <p className="text-xs text-slate-500">
          Loan officers:{' '}
          <span className="font-medium text-slate-700">{officersLabel(original.loan_officers)}</span>
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

function LoanPanel({ loan, stages, mode, canReassign, onModeChange, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
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
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
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
            {mode === 'view' && (
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

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {mode === 'edit' ? (
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
                <th className="px-3 py-2.5 font-medium">Loan Officer</th>
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
                  <td className="px-3 py-3 text-slate-600">{officersOf(loan).map(personName).join(', ') || 'Unassigned'}</td>
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
