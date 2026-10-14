import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Mail, Pencil, Phone, Search, X } from 'lucide-react'
import {
  createLoanFromOpportunity,
  fetchOpportunities,
  fetchOpportunityFilters,
  updateOpportunity,
} from '../../api/admin'
import { useAuth } from '../../common/auth/AuthContext'
import { currency, customFieldValue, formatDate } from '../../utils/format'
import { DetailGroup, DetailRow } from './DetailList'

// Keys match portal Loan.Status on the backend
export const pipelineStages = [
  { key: 'application', label: 'Application' },
  { key: 'processing', label: 'Processing' },
  { key: 'underwriting', label: 'Underwriting' },
  { key: 'approval', label: 'Approval' },
  { key: 'closing', label: 'Closing' },
  { key: 'funded', label: 'Funded' },
]

const PAGE_SIZE = 100 // backend max_page_size

const statusStyles = {
  open: 'bg-blue-100 text-blue-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  abandoned: 'bg-slate-100 text-slate-600',
}

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none'

// The list endpoint is paginated; walk every page for the selected pipeline
async function fetchAllOpportunities(params) {
  const all = []
  for (let page = 1; ; page += 1) {
    const data = await fetchOpportunities({ ...params, page, page_size: PAGE_SIZE })
    all.push(...(data?.results ?? []))
    if (!data?.next) return all
  }
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none'

// DRF returns { field: [messages] } for validation errors, { error } for GHL/permission errors
function errorMessage(err) {
  const data = err?.data
  if (data?.error) return data.error
  if (data && typeof data === 'object' && !data.detail) {
    const [field, messages] = Object.entries(data)[0] ?? []
    const message = Array.isArray(messages) ? messages[0] : messages
    if (message) return `${field.replace(/_/g, ' ')}: ${message}`
  }
  return err?.message || 'Request failed'
}

function formFromOpportunity(o) {
  return {
    name: o.name ?? '',
    monetary_value: o.monetary_value ?? '',
    status: o.status ?? '',
    pipeline_stage_id: o.pipeline_stage_id ?? '',
    expected_close_date: o.expected_close_date ?? '',
    assigned_to: o.assigned_to ?? '',
    source: o.source ?? '',
    original_close_date: o.original_close_date ?? '',
    forecast_probability: o.forecast_probability ?? '',
    effective_probability: o.effective_probability ?? '',
  }
}

// Fields saved in the dashboard only; GHL has no update field for them
const LOCAL_ONLY = ['source', 'original_close_date', 'forecast_probability', 'effective_probability']
const NULLABLE = ['expected_close_date', 'original_close_date', 'forecast_probability', 'effective_probability']

function OpportunityEditForm({ opportunity, stages, statuses, assignees, canReassign, onCancel, onSaved }) {
  const original = useMemo(() => formFromOpportunity(opportunity), [opportunity])
  const [form, setForm] = useState(original)
  const [reviewing, setReviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fields = {
    name: ['Name', (v) => v || '—'],
    monetary_value: ['Value', (v) => (Number(v) ? currency.format(Number(v)) : '$0')],
    status: ['Status', (v) => statuses.find((s) => s.value === v)?.label ?? (v || '—')],
    pipeline_stage_id: ['Stage', (v) => stages.find((s) => s.id === v)?.name ?? (v || '—')],
    expected_close_date: ['Expected close', (v) => formatDate(v) || 'Not set'],
    assigned_to: ['Assigned to', (v) => assignees.find((u) => u.user_id === v)?.name ?? (v || 'Unassigned')],
    source: ['Source', (v) => v || '—'],
    original_close_date: ['Original close', (v) => formatDate(v) || 'Not set'],
    forecast_probability: ['Forecast probability', (v) => (v === '' ? 'Not set' : `${v}%`)],
    effective_probability: ['Effective probability', (v) => (v === '' ? 'Not set' : `${v}%`)],
  }
  const changes = Object.keys(fields)
    .filter((k) => (k !== 'assigned_to' || canReassign) && String(form[k]) !== String(original[k]))
    .map((k) => ({
      key: k,
      label: fields[k][0],
      from: fields[k][1](original[k]),
      to: fields[k][1](form[k]),
      local: LOCAL_ONLY.includes(k),
    }))

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleAccept() {
    const payload = {}
    for (const { key } of changes) {
      payload[key] = NULLABLE.includes(key) && form[key] === '' ? null : form[key]
    }
    setSaving(true)
    setError('')
    try {
      onSaved(await updateOpportunity(opportunity.opportunity_id, payload))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
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
                <span className="font-medium text-slate-500">
                  {c.label}
                  {c.local && <span className="block text-[11px] font-normal text-amber-600">Dashboard only</span>}
                </span>
                <span className="text-slate-400 line-through">{c.from}</span>
                <span className="font-semibold text-slate-900">{c.to}</span>
              </li>
            ))}
          </ul>
        )}
        {changes.some((c) => !c.local) && (
          <p className="text-xs text-slate-500">Changes to the other fields are sent to GoHighLevel.</p>
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
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setError('')
        setReviewing(true)
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="opp-name" className="text-xs font-medium text-slate-500">Name</label>
        <input id="opp-name" name="name" value={form.name} onChange={handleChange} className={inputClass} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="opp-value" className="text-xs font-medium text-slate-500">Value ($)</label>
          <input
            id="opp-value" name="monetary_value" type="number" min="0" step="0.01"
            value={form.monetary_value} onChange={handleChange} className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="opp-status" className="text-xs font-medium text-slate-500">Status</label>
          <select id="opp-status" name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="opp-stage" className="text-xs font-medium text-slate-500">Stage</label>
          <select id="opp-stage" name="pipeline_stage_id" value={form.pipeline_stage_id} onChange={handleChange} className={inputClass}>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="opp-close" className="text-xs font-medium text-slate-500">Expected close</label>
          <input
            id="opp-close" name="expected_close_date" type="date"
            value={form.expected_close_date} onChange={handleChange} className={inputClass}
          />
        </div>
      </div>
      {canReassign ? (
        <div>
          <label htmlFor="opp-assigned" className="text-xs font-medium text-slate-500">Assigned to</label>
          <select id="opp-assigned" name="assigned_to" value={form.assigned_to} onChange={handleChange} className={inputClass}>
            {!form.assigned_to && <option value="">Unassigned</option>}
            {assignees.map((u) => <option key={u.user_id} value={u.user_id}>{u.name || u.email}</option>)}
          </select>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Assigned to: <span className="font-medium text-slate-700">{opportunity.assigned_to_name || 'Unassigned'}</span>
          {' '}&middot; only admins can reassign.
        </p>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
        <p className="text-xs font-semibold text-amber-700">Dashboard only</p>
        <p className="text-xs text-slate-500">GoHighLevel can't update these. A later sync from GHL may overwrite them.</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="opp-source" className="text-xs font-medium text-slate-500">Source</label>
            <input id="opp-source" name="source" value={form.source} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="opp-original" className="text-xs font-medium text-slate-500">Original close</label>
            <input
              id="opp-original" name="original_close_date" type="date"
              value={form.original_close_date} onChange={handleChange} className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="opp-fprob" className="text-xs font-medium text-slate-500">Forecast probability (%)</label>
            <input
              id="opp-fprob" name="forecast_probability" type="number" min="0" max="100"
              value={form.forecast_probability} onChange={handleChange} className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="opp-eprob" className="text-xs font-medium text-slate-500">Effective probability (%)</label>
            <input
              id="opp-eprob" name="effective_probability" type="number" min="0" max="100"
              value={form.effective_probability} onChange={handleChange} className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Review Changes
        </button>
      </div>
    </form>
  )
}

function ConvertToLoan({ opportunity, onConverted }) {
  const [confirming, setConfirming] = useState(false)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')
  const [borrowerCreated, setBorrowerCreated] = useState(null)

  if (opportunity.loan_id) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Converted to loan #{opportunity.loan_id}</p>
          {borrowerCreated !== null && (
            <p className="text-xs text-emerald-700">
              {borrowerCreated
                ? `A borrower login was created for ${opportunity.contact?.email}. It has no password yet.`
                : `Linked to the existing borrower login for ${opportunity.contact?.email}.`}
            </p>
          )}
        </div>
      </div>
    )
  }

  async function handleConvert() {
    setConverting(true)
    setError('')
    try {
      const data = await createLoanFromOpportunity(opportunity.opportunity_id)
      setBorrowerCreated(data.borrower_created)
      onConverted(opportunity, data.loan.id)
    } catch (err) {
      // This endpoint reports failures as { error: "..." }
      setError(err.data?.error || err.message || 'Failed to convert opportunity')
      setConfirming(false)
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {confirming ? (
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-sm text-slate-600">
            Create a loan from this opportunity? A borrower login will be created for{' '}
            <span className="font-medium text-slate-900">{opportunity.contact?.email || 'the contact'}</span> if one
            doesn't exist.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={converting}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {converting ? 'Converting…' : 'Confirm'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Convert to Loan
        </button>
      )}
    </div>
  )
}

function OpportunityDetail({ opportunity, stages, statuses, assignees, onClose, onConverted, onUpdated }) {
  const [mode, setMode] = useState('view')
  const { user } = useAuth()
  const canReassign = user?.role === 'admin'
  const { contact } = opportunity
  const value = Number(opportunity.monetary_value)
  const customFields = (Array.isArray(opportunity.custom_fields) ? opportunity.custom_fields : [])
    .map((field) => ({ id: field.id, value: customFieldValue(field) }))
    .filter((field) => field.value)

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={opportunity.name || 'Opportunity details'}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{opportunity.name || 'Untitled opportunity'}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {opportunity.status && (
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold capitalize ${statusStyles[opportunity.status] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {opportunity.status}
                </span>
              )}
              <span className="text-slate-500">
                {[opportunity.pipeline_name, opportunity.stage_name].filter(Boolean).join(' · ')}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {mode === 'view' && (
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
          {mode === 'edit' ? (
            <OpportunityEditForm
              opportunity={opportunity}
              stages={stages}
              statuses={statuses}
              assignees={assignees}
              canReassign={canReassign}
              onCancel={() => setMode('view')}
              onSaved={(saved) => {
                onUpdated(saved)
                setMode('view')
              }}
            />
          ) : (
          <>
          <DetailGroup title="Deal">
            <DetailRow label="Value">{value ? currency.format(value) : null}</DetailRow>
            <DetailRow label="Assigned to">{opportunity.assigned_to_name}</DetailRow>
            <DetailRow label="Source">{opportunity.source}</DetailRow>
            <DetailRow label="Expected close">{formatDate(opportunity.expected_close_date)}</DetailRow>
            <DetailRow label="Probability">
              {opportunity.effective_probability != null ? `${opportunity.effective_probability}%` : null}
            </DetailRow>
          </DetailGroup>

          <DetailGroup title="Contact">
            <DetailRow label="Name">{contact?.contact_name}</DetailRow>
            <DetailRow label="Company">{contact?.company_name}</DetailRow>
            <DetailRow label="Email">
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline">
                  <Mail className="h-3.5 w-3.5" />
                  {contact.email}
                </a>
              )}
            </DetailRow>
            <DetailRow label="Phone">
              {contact?.phone && (
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {contact.phone}
                </a>
              )}
            </DetailRow>
            {contact?.tags?.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1.5 py-2">
                {contact.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </DetailGroup>

          <DetailGroup title="Timeline">
            <DetailRow label="Created">{formatDate(opportunity.date_added, true)}</DetailRow>
            <DetailRow label="Last updated">{formatDate(opportunity.date_updated, true)}</DetailRow>
            <DetailRow label="Stage changed">{formatDate(opportunity.last_stage_change_at, true)}</DetailRow>
            <DetailRow label="Status changed">{formatDate(opportunity.last_status_change_at, true)}</DetailRow>
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

          <p className="text-xs text-slate-400">Opportunity ID: {opportunity.opportunity_id}</p>
          </>
          )}
        </div>

        {mode === 'view' && (
          <div className="border-t border-slate-200 p-5 sm:p-6">
            <ConvertToLoan key={opportunity.id} opportunity={opportunity} onConverted={onConverted} />
          </div>
        )}
      </aside>
    </div>
  )
}

function OpportunityCard({ opportunity, onOpen }) {
  const { contact } = opportunity
  const value = Number(opportunity.monetary_value)

  return (
    <button
      type="button"
      onClick={() => onOpen(opportunity)}
      className="block w-full rounded-lg border border-slate-200 bg-white p-3.5 text-left shadow-sm hover:border-emerald-300 hover:shadow focus:border-emerald-400 focus:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{opportunity.name || 'Untitled opportunity'}</p>
        {opportunity.loan_id ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            Loan
          </span>
        ) : opportunity.status && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusStyles[opportunity.status] ?? 'bg-slate-100 text-slate-600'}`}
          >
            {opportunity.status}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">{contact?.contact_name || contact?.company_name || '—'}</p>
      {contact?.email && <p className="text-xs text-slate-400">{contact.email}</p>}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs">
        <span className="font-semibold text-slate-700">{value ? currency.format(value) : '—'}</span>
        <span className="truncate text-slate-400">{opportunity.assigned_to_name || 'Unassigned'}</span>
      </div>
    </button>
  )
}

export default function PipelineSection() {
  const [pipelines, setPipelines] = useState([])
  const [statuses, setStatuses] = useState([])
  const [pipelineId, setPipelineId] = useState('')
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [opportunities, setOpportunities] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [assignees, setAssignees] = useState([])
  const [selected, setSelected] = useState(null)
  const closeDetail = useCallback(() => setSelected(null), [])

  // The edit response has no stage/pipeline names of its own refresh issues, so merge it over the list copy
  const handleUpdated = useCallback((saved) => {
    setOpportunities((list) => list.map((o) => (o.id === saved.id ? { ...o, ...saved } : o)))
    setSelected((o) => (o && o.id === saved.id ? { ...o, ...saved } : o))
  }, [])

  const handleConverted = useCallback((opportunity, loanId) => {
    const mark = (o) => (o.id === opportunity.id ? { ...o, loan_id: loanId } : o)
    setOpportunities((list) => list.map(mark))
    setSelected(mark)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchOpportunityFilters()
      .then((data) => {
        if (cancelled) return
        setPipelines(data?.pipelines ?? [])
        setStatuses(data?.statuses ?? [])
        setAssignees(data?.assigned_to ?? [])
        setPipelineId(data?.pipelines?.[0]?.id ?? '')
      })
      .catch((err) => !cancelled && setError(err.message || 'Failed to load pipelines'))
      .finally(() => !cancelled && setLoadingFilters(false))
    return () => {
      cancelled = true
    }
  }, [])

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!pipelineId) return
    let cancelled = false
    setLoading(true)
    setError('')
    fetchAllOpportunities({ pipeline_id: pipelineId, status, search })
      .then((list) => !cancelled && setOpportunities(list))
      .catch((err) => !cancelled && setError(err.message || 'Failed to load opportunities'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [pipelineId, status, search])

  const stages = useMemo(
    () => pipelines.find((p) => p.id === pipelineId)?.stages ?? [],
    [pipelines, pipelineId],
  )

  const byStage = useMemo(() => {
    const groups = {}
    for (const opportunity of opportunities) {
      ;(groups[opportunity.pipeline_stage_id] ??= []).push(opportunity)
    }
    return groups
  }, [opportunities])

  if (loadingFilters) {
    return <p className="py-12 text-center text-sm text-slate-500">Loading pipelines…</p>
  }

  if (!pipelines.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="text-sm text-slate-500">{error || 'No pipelines synced from the CRM yet.'}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search opportunity, contact, email…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          {pipelines.length > 1 && (
            <select
              value={pipelineId}
              onChange={(e) => setPipelineId(e.target.value)}
              aria-label="Pipeline"
              className={selectClass}
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
            className={selectClass}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${opportunities.length} opportunit${opportunities.length === 1 ? 'y' : 'ies'}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className={`flex gap-4 ${loading ? 'opacity-60' : ''}`} style={{ minWidth: 'max-content' }}>
          {stages.map((stage) => {
            const stageOpportunities = byStage[stage.id] ?? []
            return (
              <div key={stage.id} className="w-72 shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-slate-700">{stage.name}</h2>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-600">
                    {stageOpportunities.length}
                  </span>
                </div>
                <div className="space-y-3 rounded-xl bg-slate-100/70 p-2.5">
                  {stageOpportunities.length === 0 ? (
                    <p className="px-1.5 py-3 text-center text-xs text-slate-400">No opportunities</p>
                  ) : (
                    stageOpportunities.map((opportunity) => (
                      <OpportunityCard key={opportunity.id} opportunity={opportunity} onOpen={setSelected} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <OpportunityDetail
          key={selected.id}
          opportunity={selected}
          stages={stages}
          statuses={statuses}
          assignees={assignees}
          onClose={closeDetail}
          onConverted={handleConverted}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
