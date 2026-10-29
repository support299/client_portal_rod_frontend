import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus } from 'lucide-react'
import { updateLoan } from '../../api/admin'
import { uploadLoanDocument } from '../../api/documents'
import { changeDrawStatus, createDraw, deleteDraw, fetchDrawSummary, fetchDraws, updateDraw } from '../../api/draws'
import { useAuth } from '../../common/auth/AuthContext'
import { drawStatusLabel, money } from '../../utils/draws'
import { errorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { DrawFiles, DrawHistory, DrawStatusBadge, FilesButton } from '../DrawShared'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none'
const smallButton =
  'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50'
const primaryButton =
  'inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60'

const iconButton =
  'inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50'

// Statuses that keep the staff note on the draw for the borrower to see
const noteForBorrower = ['needs_info', 'rejected']

// The usual forward move from each status, offered as the row's main button (see DrawService.STAFF_TRANSITIONS)
const nextStep = {
  submitted: ['inspection_ordered', 'Order inspection'],
  inspection_ordered: ['inspected', 'Mark inspected'],
  inspected: ['approved', 'Approve'],
  approved: ['funded', 'Mark funded'],
}
// Draws waiting on staff are flagged; final ones fold into "Completed draws"
const staffActionStatuses = Object.keys(nextStep)
const closedStatuses = ['funded', 'rejected', 'cancelled']

const drawFilters = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'action', label: 'Needs your action', match: (d) => staffActionStatuses.includes(d.status) },
  { id: 'waiting', label: 'Waiting on borrower', match: (d) => d.status === 'needs_info' },
]

// Progress steps shown in an expanded draw; rejected and cancelled draws are off the track
const trackerSteps = [
  ['Submitted', ['submitted', 'needs_info']],
  ['Inspection', ['inspection_ordered', 'inspected']],
  ['Approved', ['approved']],
  ['Funded', ['funded']],
]

const pct = (part, whole) => (whole > 0 ? Math.min(100, (part / whole) * 100) : 0)

function HoldbackForm({ loanId, summary, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(summary?.holdback ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateLoan(loanId, { holdback_amount: value === '' ? null : value })
      setEditing(false)
      await onSaved()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    const hasHoldback = summary?.holdback != null
    return (
      <button
        type="button"
        onClick={() => {
          setValue(summary?.holdback ?? '')
          setEditing(true)
        }}
        className={hasHoldback ? 'rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700' : smallButton}
        title={hasHoldback ? 'Edit holdback' : undefined}
        aria-label={hasHoldback ? 'Edit holdback' : undefined}
      >
        <Pencil className="h-3.5 w-3.5" />
        {!hasHoldback && 'Set holdback'}
      </button>
    )
  }

  return (
    <form onSubmit={save} className="flex basis-full flex-wrap items-end gap-2">
      <div>
        <label htmlFor="holdback-amount" className="text-xs font-medium text-slate-500">Holdback ($)</label>
        <input
          id="holdback-amount"
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Empty: no draws"
          className={`${inputClass} w-48`}
        />
      </div>
      <button type="submit" disabled={saving} className={primaryButton}>{saving ? 'Saving…' : 'Save'}</button>
      <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
        Cancel
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  )
}

function NewDrawForm({ loanId, available, onCancel, onCreated }) {
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createDraw(loanId, { amount_requested: amount, borrower_comment: comment.trim() })
      await onCreated()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-900">New draw for the borrower</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="new-draw-amount" className="text-xs font-medium text-slate-500">Requested amount ($)</label>
          <input
            id="new-draw-amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">Available: {money(available)}</p>
        </div>
        <div>
          <label htmlFor="new-draw-comment" className="text-xs font-medium text-slate-500">Comment</label>
          <input id="new-draw-comment" value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryButton}>{saving ? 'Submitting…' : 'Submit draw'}</button>
      </div>
    </form>
  )
}

// Move a draw to one of its allowed statuses, with a reason; approving needs the approved amount
function StatusForm({ loanId, draw, initialStatus, onDone }) {
  const [status, setStatus] = useState(initialStatus ?? draw.allowed_statuses[0])
  const [note, setNote] = useState('')
  const [amountApproved, setAmountApproved] = useState(draw.amount_approved ?? draw.amount_requested)
  const [fundingReference, setFundingReference] = useState(draw.funding_reference)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await changeDrawStatus(loanId, draw.id, {
        status,
        note: note.trim(),
        ...(status === 'approved' && { amount_approved: amountApproved }),
        ...(status === 'funded' && { funding_reference: fundingReference.trim() }),
      })
      await onDone()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`draw-status-${draw.id}`} className="text-xs font-medium text-slate-500">Move to</label>
          <select
            id={`draw-status-${draw.id}`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {draw.allowed_statuses.map((s) => (
              <option key={s} value={s}>
                {draw.status === 'approved' && s === 'inspected' ? 'Inspected (undo approval)' : drawStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        {status === 'approved' && (
          <div>
            <label htmlFor={`draw-approved-${draw.id}`} className="text-xs font-medium text-slate-500">Approved amount ($)</label>
            <input
              id={`draw-approved-${draw.id}`}
              type="number"
              min="0"
              step="0.01"
              required
              value={amountApproved}
              onChange={(e) => setAmountApproved(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
        {status === 'funded' && (
          <div>
            <label htmlFor={`draw-ref-${draw.id}`} className="text-xs font-medium text-slate-500">Wire / ACH reference</label>
            <input
              id={`draw-ref-${draw.id}`}
              value={fundingReference}
              onChange={(e) => setFundingReference(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </div>
      <div>
        <label htmlFor={`draw-note-${draw.id}`} className="text-xs font-medium text-slate-500">
          Note {noteForBorrower.includes(status) ? '(shown to the borrower)' : '(logged in the history and loan chat)'}
        </label>
        <textarea
          id={`draw-note-${draw.id}`}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required={noteForBorrower.includes(status)}
          placeholder={status === 'needs_info' ? 'What do you need from the borrower?' : ''}
          className={`${inputClass} resize-none`}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryButton}>
          {saving ? 'Saving…' : `Move to ${drawStatusLabel(status)}`}
        </button>
      </div>
    </form>
  )
}

const detailFields = [
  ['amount_requested', 'Requested amount ($)', 'number'],
  ['amount_approved', 'Approved amount ($)', 'number'],
  ['inspector', 'Inspector', 'text'],
  ['inspection_date', 'Inspection date', 'date'],
  ['funding_reference', 'Wire / ACH reference', 'text'],
]

function DetailsForm({ loanId, draw, onDone }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries([...detailFields.map(([key]) => [key, draw[key] ?? '']), ['staff_note', draw.staff_note]]),
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    // Send only what changed; empty number/date fields are cleared
    const payload = Object.fromEntries(
      Object.entries(form)
        .filter(([key, value]) => String(value) !== String(draw[key] ?? ''))
        .map(([key, value]) => [key, value === '' && ['amount_approved', 'inspection_date'].includes(key) ? null : value]),
    )
    setSaving(true)
    setError('')
    try {
      if (Object.keys(payload).length) await updateDraw(loanId, draw.id, payload)
      await onDone()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {detailFields.map(([key, label, type]) => (
          <div key={key}>
            <label htmlFor={`draw-${key}-${draw.id}`} className="text-xs font-medium text-slate-500">{label}</label>
            <input
              id={`draw-${key}-${draw.id}`}
              type={type}
              {...(type === 'number' && { min: 0, step: '0.01' })}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className={inputClass}
            />
          </div>
        ))}
      </div>
      <div>
        <label htmlFor={`draw-staff-note-${draw.id}`} className="text-xs font-medium text-slate-500">
          Note to borrower (shown on needs info / rejected)
        </label>
        <textarea
          id={`draw-staff-note-${draw.id}`}
          rows={2}
          value={form.staff_note}
          onChange={(e) => setForm((f) => ({ ...f, staff_note: e.target.value }))}
          className={`${inputClass} resize-none`}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryButton}>{saving ? 'Saving…' : 'Save details'}</button>
      </div>
    </form>
  )
}

// Where the draw is on Submitted → Inspection → Approved → Funded
function DrawTracker({ status }) {
  const at = trackerSteps.findIndex(([, statuses]) => statuses.includes(status))
  if (at < 0) return null
  return (
    <ol className="flex flex-wrap items-center gap-1 text-[11px]" aria-label="Draw progress">
      {trackerSteps.map(([label], i) => (
        <li key={label} className="flex items-center gap-1">
          {i > 0 && <span className={`h-px w-5 ${i <= at ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
          <span className={`h-2 w-2 rounded-full ${i <= at ? 'bg-emerald-600' : 'bg-slate-300'}`} />
          <span className={i <= at ? 'font-semibold text-emerald-700' : 'text-slate-400'}>{label}</span>
        </li>
      ))}
    </ol>
  )
}

// ⋯ button with a dropdown of actions; closes on outside click or Escape
function RowMenu({ label, items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={iconButton}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-10 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 disabled:opacity-50 ${
                item.danger ? 'text-red-600' : 'text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// One line per draw with its next step; details, files, forms and history show when expanded
function DrawRow({ loanId, draw, isAdmin, expanded, onExpandedChange, onChanged, onError }) {
  // null, 'status' or 'details'
  const [panel, setPanel] = useState(null)
  const [moveTo, setMoveTo] = useState(null)
  const [busy, setBusy] = useState(false)

  async function addFiles(files) {
    setBusy(true)
    const failed = []
    for (const file of files) {
      try {
        await uploadLoanDocument(loanId, { file, draw: draw.id })
      } catch (err) {
        failed.push(`${file.name} (${errorMessage(err)})`)
      }
    }
    if (failed.length) onError(`These files didn't upload: ${failed.join(', ')}`)
    await onChanged()
    setBusy(false)
  }

  async function remove() {
    if (!window.confirm(`Delete Draw #${draw.number}? It stops counting against the holdback; its files and history are kept.`)) return
    setBusy(true)
    try {
      await deleteDraw(loanId, draw.id)
      await onChanged()
    } catch (err) {
      onError(errorMessage(err))
      setBusy(false)
    }
  }

  const done = async () => {
    setPanel(null)
    await onChanged()
  }

  const openPanel = (name, status = null) => {
    setMoveTo(status)
    setPanel(name)
    onExpandedChange(true)
  }

  const next = nextStep[draw.status]
  const canNext = next && draw.allowed_statuses.includes(next[0])
  const fileCount = draw.files?.length ?? 0
  const Chevron = expanded ? ChevronDown : ChevronRight

  const menuItems = [
    ...draw.allowed_statuses
      .filter((s) => !canNext || s !== next[0])
      .map((s) => ({
        label: draw.status === 'approved' && s === 'inspected' ? 'Undo approval' : `Move to ${drawStatusLabel(s)}`,
        onSelect: () => openPanel('status', s),
      })),
    { label: 'Edit details', onSelect: () => openPanel('details') },
    ...(isAdmin ? [{ label: 'Delete draw', danger: true, disabled: busy, onSelect: remove }] : []),
  ]

  const facts = [
    ['Approved', money(draw.amount_approved)],
    ['Inspection', [formatDate(draw.inspection_date), draw.inspector].filter(Boolean).join(' · ') || '—'],
    ['Funding ref.', draw.funding_reference || '—'],
  ]

  return (
    <li
      className={`border-l-4 ${staffActionStatuses.includes(draw.status) ? 'border-l-amber-400' : 'border-l-transparent'} ${
        expanded ? 'bg-slate-50/60' : ''
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <Chevron className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-900">Draw #{draw.number}</span>
              <DrawStatusBadge status={draw.status} />
              {fileCount > 0 && (
                <span className="text-xs text-slate-400">
                  {fileCount} file{fileCount === 1 ? '' : 's'}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs text-slate-400">
              {[formatDate(draw.submitted_at), draw.submitted_by?.full_name?.trim()].filter(Boolean).join(' · ')}
            </span>
          </span>
        </button>
        <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-900">
          {money(draw.amount_requested)}
        </span>
        <span className="hidden w-24 shrink-0 text-right text-sm tabular-nums text-slate-500 sm:block">
          {money(draw.amount_approved)}
        </span>
        <div className="flex w-36 shrink-0 items-center justify-end gap-1">
          {canNext && (
            <button
              type="button"
              onClick={() => openPanel('status', next[0])}
              className="whitespace-nowrap rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {next[1]}
            </button>
          )}
          <RowMenu label={`Actions for Draw #${draw.number}`} items={menuItems} />
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 px-3 pb-4 pl-9">
          <DrawTracker status={draw.status} />

          <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
            {facts.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-slate-400">{label}</dt>
                <dd className="truncate font-medium tabular-nums text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>

          {draw.borrower_comment && (
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-500">Borrower:</span> {draw.borrower_comment}</p>
          )}
          {draw.staff_note && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span className="font-semibold">Note to borrower:</span> {draw.staff_note}
            </p>
          )}

          <DrawFiles files={draw.files} onError={onError} />

          {panel === 'status' && <StatusForm key={moveTo} loanId={loanId} draw={draw} initialStatus={moveTo} onDone={done} />}
          {panel === 'details' && <DetailsForm loanId={loanId} draw={draw} onDone={done} />}

          {panel == null && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => setPanel('details')} className={smallButton}>
                <Pencil className="h-3.5 w-3.5" />
                Edit details
              </button>
              <FilesButton label="Add files" busy={busy} onFiles={addFiles} className={smallButton} />
            </div>
          )}

          <DrawHistory changes={draw.status_changes} />
        </div>
      )}
    </li>
  )
}

const newestFirst = (list) => [...(list ?? [])].sort((a, b) => b.number - a.number)

// initial ({ draws, summary }, from the loan page's single call) skips the first fetch;
// changes reload from the draws endpoints
export default function LoanDraws({ loanId, initial }) {
  const { user } = useAuth()
  const [draws, setDraws] = useState(() => newestFirst(initial?.draws))
  const [summary, setSummary] = useState(initial?.summary ?? null)
  const [loading, setLoading] = useState(!initial)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [filterId, setFilterId] = useState('all')
  const [expanded, setExpanded] = useState(() => new Set()) // draw ids
  const [showClosed, setShowClosed] = useState(false)

  const load = useCallback(async () => {
    try {
      const [list, totals] = await Promise.all([fetchDraws(loanId), fetchDrawSummary(loanId)])
      setDraws(newestFirst(list))
      setSummary(totals)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [loanId])

  useEffect(() => {
    if (!initial) load()
  }, [load, initial])

  if (loading) return <p className="text-sm text-slate-500">Loading draws…</p>

  const hasHoldback = summary?.holdback != null
  const holdback = Number(summary?.holdback ?? 0)
  const redeemed = Number(summary?.redeemed ?? 0)
  const inProgress = Number(summary?.in_progress ?? 0)

  const filter = drawFilters.find((f) => f.id === filterId)
  const isClosed = (d) => closedStatuses.includes(d.status)
  const openDraws = draws.filter((d) => !isClosed(d) && filter.match(d))
  const closedDraws = filter.id === 'all' ? draws.filter(isClosed) : []
  const fundedTotal = closedDraws
    .filter((d) => d.status === 'funded')
    .reduce((sum, d) => sum + Number(d.amount_approved ?? 0), 0)

  const setRowExpanded = (id, open) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })

  const renderRow = (draw) => (
    <DrawRow
      key={draw.id}
      loanId={loanId}
      draw={draw}
      isAdmin={user?.role === 'admin'}
      expanded={expanded.has(draw.id)}
      onExpandedChange={(open) => setRowExpanded(draw.id, open)}
      onChanged={load}
      onError={setError}
    />
  )

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          <button type="button" onClick={() => setError('')} className="font-semibold underline">Dismiss</button>
        </p>
      )}

      <div className="rounded-lg bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-slate-500">Construction holdback</span>
            {hasHoldback && <span className="font-semibold tabular-nums text-slate-900">{money(summary.holdback)}</span>}
            <HoldbackForm loanId={loanId} summary={summary} onSaved={load} />
          </div>
          {hasHoldback ? (
            <p className="text-xs text-slate-500">
              <span className="font-semibold tabular-nums text-slate-800">{money(summary.available)}</span> still available
            </p>
          ) : (
            <p className="text-xs text-slate-500">Set a holdback to let the borrower request draws.</p>
          )}
        </div>
        {hasHoldback && (
          <>
            <div
              className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-200"
              role="img"
              aria-label={`${Math.round(pct(redeemed, holdback))}% redeemed, ${Math.round(pct(inProgress, holdback))}% in progress`}
            >
              <div className="h-full bg-emerald-600" style={{ width: `${pct(redeemed, holdback)}%` }} />
              <div className="h-full bg-blue-400" style={{ width: `${pct(inProgress, holdback)}%` }} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-emerald-600" />
                Redeemed <span className="tabular-nums">{money(redeemed)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-blue-400" />
                In progress <span className="tabular-nums">{money(inProgress)}</span>
              </span>
            </div>
          </>
        )}
      </div>

      {hasHoldback && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {draws.length > 0 &&
                drawFilters.map((f) => {
                  const active = f.id === filter.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterId(f.id)}
                      aria-pressed={active}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {f.label} <span className={active ? 'text-slate-300' : 'text-slate-400'}>{draws.filter(f.match).length}</span>
                    </button>
                  )
                })}
            </div>
            {!creating && (
              <button type="button" onClick={() => setCreating(true)} className={primaryButton}>
                <Plus className="h-4 w-4" />
                New draw
              </button>
            )}
          </div>

          {creating && (
            <NewDrawForm
              loanId={loanId}
              available={summary?.available}
              onCancel={() => setCreating(false)}
              onCreated={async () => {
                setCreating(false)
                await load()
              }}
            />
          )}

          {draws.length === 0 ? (
            <p className="text-sm text-slate-400">No draws requested yet.</p>
          ) : openDraws.length === 0 && closedDraws.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
              No draws match “{filter.label}”.
            </p>
          ) : (
            <div className="rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 rounded-t-lg border-b border-l-4 border-slate-200 border-l-transparent bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="flex-1 pl-6">Draw</span>
                <span className="w-24 text-right">Requested</span>
                <span className="hidden w-24 text-right sm:block">Approved</span>
                <span className="w-36" />
              </div>
              {openDraws.length > 0 && <ul className="divide-y divide-slate-100">{openDraws.map(renderRow)}</ul>}
              {closedDraws.length > 0 && (
                <section className={openDraws.length > 0 ? 'border-t border-slate-200' : undefined}>
                  <button
                    type="button"
                    onClick={() => setShowClosed((s) => !s)}
                    aria-expanded={showClosed}
                    className="flex w-full items-center gap-1.5 bg-slate-50 px-3 py-1.5 text-left text-xs font-semibold text-slate-600 last:rounded-b-lg hover:bg-slate-100"
                  >
                    {showClosed ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    Completed draws
                    <span className="font-normal text-slate-400">
                      {closedDraws.length}
                      {fundedTotal > 0 && <> &middot; {money(fundedTotal)} funded</>}
                    </span>
                  </button>
                  {showClosed && (
                    <ul className="divide-y divide-slate-100 border-t border-slate-100">{closedDraws.map(renderRow)}</ul>
                  )}
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
