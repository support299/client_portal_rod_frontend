import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, Pencil, Phone, Search, X } from 'lucide-react'
import { fetchLoans, fetchUsers, updateLoan } from '../../api/admin'
import { useAuth } from '../../common/auth/AuthContext'
import { currency, customFieldValue, formatDate } from '../../utils/format'
import { DetailGroup, DetailRow } from './DetailList'

const PAGE_SIZE = 25

// Values match Loan.Status on the backend
const loanStatuses = [
  { value: 'application_received', label: 'Application Received', classes: 'bg-slate-100 text-slate-600' },
  { value: 'processing', label: 'Processing', classes: 'bg-blue-100 text-blue-700' },
  { value: 'underwriting', label: 'Underwriting', classes: 'bg-purple-100 text-purple-700' },
  { value: 'appraisal', label: 'Appraisal', classes: 'bg-orange-100 text-orange-700' },
  { value: 'final_approval', label: 'Final Approval', classes: 'bg-cyan-100 text-cyan-700' },
  { value: 'closing', label: 'Closing', classes: 'bg-amber-100 text-amber-800' },
  { value: 'funded', label: 'Funded', classes: 'bg-emerald-100 text-emerald-700' },
]

function personName(user) {
  return user?.full_name?.trim() || user?.email || null
}

function formatAmount(value) {
  const amount = Number(value)
  return amount ? currency.format(amount) : null
}

function StatusBadge({ loan }) {
  const config = loanStatuses.find((s) => s.value === loan.status)
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${config?.classes ?? 'bg-slate-100 text-slate-600'}`}
    >
      {loan.status_label || config?.label || loan.status}
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

function LoanDetails({ loan }) {
  const { borrower, loan_officer: officer } = loan
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
        <DetailRow label="Loan officer">
          {officer && (
            <>
              {personName(officer)}
              {officer.full_name?.trim() && <span className="block text-xs font-normal text-slate-400">{officer.email}</span>}
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

function EditLoanForm({ loan, canReassign, onCancel, onSaved, onSavingChange }) {
  const [form, setForm] = useState({
    status: loan.status,
    loan_amount: loan.loan_amount ?? '',
    expected_close_date: loan.expected_close_date ?? '',
    loan_officer: loan.loan_officer?.id != null ? String(loan.loan_officer.id) : '',
  })
  const [officers, setOfficers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Any active non-borrower can be the loan officer (matches LoanUpdateSerializer)
  useEffect(() => {
    if (!canReassign) return
    let cancelled = false
    fetchUsers({ is_active: 'true', page_size: 100 })
      .then((data) => {
        if (cancelled) return
        const staff = (data?.results ?? []).filter((u) => u.role !== 'borrower')
        const current = loan.loan_officer
        setOfficers(current && !staff.some((u) => u.id === current.id) ? [current, ...staff] : staff)
      })
      .catch(() => !cancelled && setError('Could not load loan officers.'))
    return () => {
      cancelled = true
    }
  }, [canReassign, loan.loan_officer])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      status: form.status,
      loan_amount: form.loan_amount === '' ? '0' : String(form.loan_amount),
      expected_close_date: form.expected_close_date || null,
    }
    if (canReassign) payload.loan_officer = form.loan_officer ? Number(form.loan_officer) : null

    setSaving(true)
    onSavingChange(true)
    setError('')
    try {
      onSaved(await updateLoan(loan.id, payload))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
      onSavingChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="loan-status" className="text-xs font-medium text-slate-500">Status</label>
          <select id="loan-status" name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {loanStatuses.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
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
      {canReassign ? (
        <div>
          <label htmlFor="loan-officer" className="text-xs font-medium text-slate-500">Loan Officer</label>
          <select id="loan-officer" name="loan_officer" value={form.loan_officer} onChange={handleChange} className={inputClass}>
            <option value="">Unassigned</option>
            {officers.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {personName(u)}
                {u.role_label ? ` (${u.role_label})` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Loan officer: <span className="font-medium text-slate-700">{personName(loan.loan_officer) || 'Unassigned'}</span>
          {' '}&middot; only admins can reassign.
        </p>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

function LoanPanel({ loan, mode, canReassign, onModeChange, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const close = () => !saving && onClose()

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && !saving && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={loan.name || `Loan #${loan.id}`}
        className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl"
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
  const { user } = useAuth()
  const canReassign = user?.role === 'admin'

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const selectedLoan = loans.find((l) => l.id === selectedId)

  function openLoan(loan, mode = 'view') {
    setSelectedId(loan.id)
    setPanelMode(mode)
  }

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
          {loanStatuses.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
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
                  <td className="px-3 py-3 text-slate-600">{personName(loan.loan_officer) || 'Unassigned'}</td>
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
