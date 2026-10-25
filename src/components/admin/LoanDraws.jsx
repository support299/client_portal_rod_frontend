import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { updateLoan } from '../../api/admin'
import { uploadLoanDocument } from '../../api/documents'
import { changeDrawStatus, createDraw, deleteDraw, fetchDrawSummary, fetchDraws, updateDraw } from '../../api/draws'
import { useAuth } from '../../common/auth/AuthContext'
import { drawStatusLabel, money } from '../../utils/draws'
import { errorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { DrawFiles, DrawHistory, DrawStatusBadge, DrawSummaryBar, FilesButton } from '../DrawShared'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none'
const smallButton =
  'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50'
const primaryButton =
  'inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60'

// Statuses that keep the staff note on the draw for the borrower to see
const noteForBorrower = ['needs_info', 'rejected']

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
    return (
      <button
        type="button"
        onClick={() => {
          setValue(summary?.holdback ?? '')
          setEditing(true)
        }}
        className={smallButton}
      >
        <Pencil className="h-3.5 w-3.5" />
        {summary?.holdback == null ? 'Set holdback' : 'Edit holdback'}
      </button>
    )
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
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
function StatusForm({ loanId, draw, onDone }) {
  const [status, setStatus] = useState(draw.allowed_statuses[0])
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

function DrawCard({ loanId, draw, isAdmin, onChanged, onError }) {
  // null, 'status' or 'details'
  const [panel, setPanel] = useState(null)
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

  const facts = [
    ['Requested', money(draw.amount_requested)],
    ['Approved', money(draw.amount_approved)],
    ['Submitted', [formatDate(draw.submitted_at), draw.submitted_by?.full_name?.trim()].filter(Boolean).join(' · ')],
    ['Inspection', [formatDate(draw.inspection_date), draw.inspector].filter(Boolean).join(' · ') || '—'],
    ['Funding ref.', draw.funding_reference || '—'],
  ]

  return (
    <li className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Draw #{draw.number}</p>
        <DrawStatusBadge status={draw.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-5">
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

      {panel === 'status' && <StatusForm loanId={loanId} draw={draw} onDone={done} />}
      {panel === 'details' && <DetailsForm loanId={loanId} draw={draw} onDone={done} />}

      {panel == null && (
        <div className="flex flex-wrap items-center gap-1.5">
          {draw.allowed_statuses.length > 0 && (
            <button type="button" onClick={() => setPanel('status')} className={primaryButton}>
              Change status
            </button>
          )}
          <button type="button" onClick={() => setPanel('details')} className={smallButton}>
            <Pencil className="h-3.5 w-3.5" />
            Edit details
          </button>
          <FilesButton label="Add files" busy={busy} onFiles={addFiles} className={smallButton} />
          {isAdmin && (
            <button type="button" disabled={busy} onClick={remove} className={smallButton} aria-label={`Delete Draw #${draw.number}`}>
              <Trash2 className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}
        </div>
      )}

      <DrawHistory changes={draw.status_changes} />
    </li>
  )
}

export default function LoanDraws({ loanId }) {
  const { user } = useAuth()
  const [draws, setDraws] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [list, totals] = await Promise.all([fetchDraws(loanId), fetchDrawSummary(loanId)])
      setDraws([...(list ?? [])].sort((a, b) => b.number - a.number))
      setSummary(totals)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [loanId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <p className="text-sm text-slate-500">Loading draws…</p>

  const hasHoldback = summary?.holdback != null

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          <button type="button" onClick={() => setError('')} className="font-semibold underline">Dismiss</button>
        </p>
      )}

      <div className="space-y-4 rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Construction holdback</p>
            <p className="text-xs text-slate-500">
              {hasHoldback ? 'Every draw comes out of this amount.' : 'Set a holdback to let the borrower request draws.'}
            </p>
          </div>
          <HoldbackForm loanId={loanId} summary={summary} onSaved={load} />
        </div>
        {hasHoldback && <DrawSummaryBar summary={summary} />}
      </div>

      {hasHoldback && (
        <>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Draws ({draws.length})</h3>
            {!creating && (
              <button type="button" onClick={() => setCreating(true)} className={smallButton}>
                <Plus className="h-3.5 w-3.5" />
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
          ) : (
            <ul className="space-y-3">
              {draws.map((draw) => (
                <DrawCard
                  key={draw.id}
                  loanId={loanId}
                  draw={draw}
                  isAdmin={user?.role === 'admin'}
                  onChanged={load}
                  onError={setError}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
