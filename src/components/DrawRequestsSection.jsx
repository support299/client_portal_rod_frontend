import { useCallback, useEffect, useState } from 'react'
import { Check, Clock, MessageSquare, Pencil, Plus, Upload, X } from 'lucide-react'
import { uploadLoanDocument } from '../api/documents'
import { changeDrawStatus, createDraw, fetchDrawSummary, fetchDraws, updateDraw } from '../api/draws'
import { drawRequestStages, drawStatusStyles } from '../common/constants/uiStyles'
import { money } from '../utils/draws'
import { errorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'
import { DrawFiles, DrawHistory, DrawStatusBadge, DrawSummaryBar, FilesButton } from './DrawShared'
import PropertySelector from './PropertySelector'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none'
const outlineButton =
  'flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60'
const primaryButton =
  'flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50'

// Statuses in which the borrower may still change the amount and comment (DrawService.BORROWER_EDITABLE)
const editableStatuses = ['submitted', 'needs_info']
// No more files once a draw is settled
const closedStatuses = ['funded', 'rejected', 'cancelled']

// Upload each file to the draw; returns the names that failed
async function uploadFiles(loanId, drawId, files) {
  const failed = []
  for (const file of files) {
    try {
      await uploadLoanDocument(loanId, { file, draw: drawId })
    } catch (err) {
      failed.push(`${file.name} (${errorMessage(err)})`)
    }
  }
  return failed
}

function RequestDrawForm({ available, onClose, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const value = Number(amount)
    if (!amount || !Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than $0.')
      return
    }
    if (value > available) {
      setError(`Amount can't exceed your available funds of ${money(available)}.`)
      return
    }
    setSaving(true)
    try {
      await onSubmit({ amount_requested: amount, borrower_comment: comment.trim() }, files)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Request a Draw</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close form"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4">
        <label htmlFor="draw-amount" className="text-sm font-medium text-slate-700">Requested Amount</label>
        <input
          id="draw-amount"
          type="number"
          min="0"
          step="0.01"
          max={available}
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setError('')
          }}
          className={`${inputClass} sm:w-64`}
        />
        <p className="mt-1 text-xs text-slate-400">Available: {money(available)}</p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="draw-files"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-6 text-center hover:border-emerald-300 hover:bg-emerald-50"
        >
          <Upload className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Photos, invoices and lien waivers</span>
          <span className="text-xs text-slate-400">
            {files.length > 0 ? `${files.length} file(s) selected` : 'Click to choose files'}
          </span>
        </label>
        <input
          id="draw-files"
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        {files.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {files.map((file) => (
              <li key={file.name} className="truncate text-xs text-slate-500">{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="draw-comment" className="text-sm font-medium text-slate-700">Comments</label>
        <textarea
          id="draw-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What work is this draw for?"
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryButton}>
          <Upload className="h-4 w-4" />
          {saving ? 'Submitting…' : 'Submit Draw Request'}
        </button>
      </div>
    </form>
  )
}

function DrawStepper({ status }) {
  const stage = drawStatusStyles[status]?.[2]
  if (stage == null) return null
  return (
    <div className="flex items-center overflow-x-auto">
      {drawRequestStages.map((label, i) => (
        <div key={label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                i < stage
                  ? 'bg-emerald-600 text-white'
                  : i === stage
                    ? 'border-2 border-emerald-600 bg-white text-emerald-600'
                    : 'border-2 border-slate-200 bg-white text-slate-300'
              }`}
            >
              {i < stage ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={`whitespace-nowrap text-[11px] font-medium ${i <= stage ? 'text-emerald-700' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
          {i < drawRequestStages.length - 1 && (
            <div className={`mx-1.5 h-0.5 min-w-4 flex-1 ${i < stage ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function EditDrawForm({ draw, onCancel, onSave }) {
  const [amount, setAmount] = useState(draw.amount_requested)
  const [comment, setComment] = useState(draw.borrower_comment)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ amount_requested: amount, borrower_comment: comment.trim() })
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg bg-slate-50 p-4">
      <div>
        <label htmlFor={`edit-amount-${draw.id}`} className="text-xs font-medium text-slate-500">Requested Amount</label>
        <input
          id={`edit-amount-${draw.id}`}
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${inputClass} bg-white sm:w-64`}
        />
      </div>
      <div>
        <label htmlFor={`edit-comment-${draw.id}`} className="text-xs font-medium text-slate-500">Comments</label>
        <textarea
          id={`edit-comment-${draw.id}`}
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={`${inputClass} resize-none bg-white`}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function DrawItem({ loanId, draw, onChanged, onError }) {
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const canEdit = editableStatuses.includes(draw.status)
  const canResubmit = draw.allowed_statuses.includes('submitted')
  const canCancel = draw.allowed_statuses.includes('cancelled')

  async function run(action) {
    setBusy(true)
    try {
      await action()
      await onChanged()
    } catch (err) {
      onError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function addFiles(files) {
    setBusy(true)
    const failed = await uploadFiles(loanId, draw.id, files)
    if (failed.length) onError(`These files didn't upload: ${failed.join(', ')}`)
    await onChanged()
    setBusy(false)
  }

  const shownAmount = ['approved', 'funded'].includes(draw.status) && draw.amount_approved != null
    ? draw.amount_approved
    : draw.amount_requested

  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          Draw #{draw.number} &middot; {money(shownAmount)}
          {shownAmount !== draw.amount_requested && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">(requested {money(draw.amount_requested)})</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <DrawStatusBadge status={draw.status} />
          <span className="text-xs text-slate-400">Requested {formatDate(draw.submitted_at)}</span>
        </div>
      </div>

      {draw.staff_note && ['needs_info', 'rejected'].includes(draw.status) && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="font-semibold">From your loan team:</span> {draw.staff_note}
        </p>
      )}

      {draw.borrower_comment && !editing && (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {draw.borrower_comment}
        </p>
      )}

      {editing ? (
        <EditDrawForm
          draw={draw}
          onCancel={() => setEditing(false)}
          onSave={async (payload) => {
            await updateDraw(loanId, draw.id, payload)
            setEditing(false)
            await onChanged()
          }}
        />
      ) : (
        <div className="mt-3">
          <DrawStepper status={draw.status} />
        </div>
      )}

      <div className="mt-3">
        <DrawFiles files={draw.files} onError={onError} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!closedStatuses.includes(draw.status) && (
          <FilesButton label="Add files" busy={busy} onFiles={addFiles} className={outlineButton} />
        )}
        {canEdit && !editing && (
          <button type="button" disabled={busy} onClick={() => setEditing(true)} className={outlineButton}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
        {canResubmit && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => changeDrawStatus(loanId, draw.id, { status: 'submitted' }))}
            className={outlineButton}
          >
            <Check className="h-3.5 w-3.5" />
            Resubmit
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              window.confirm(`Cancel Draw #${draw.number}?`) &&
              run(() => changeDrawStatus(loanId, draw.id, { status: 'cancelled' }))
            }
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
            Cancel draw
          </button>
        )}
      </div>

      <div className="mt-3">
        <DrawHistory changes={draw.status_changes} />
      </div>
    </li>
  )
}

function NotYetAvailableCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Clock className="h-6 w-6" />
      </div>
      <p className="mt-4 text-base font-semibold text-slate-900">Draws not available yet</p>
      <p className="mt-1 text-sm text-slate-500">
        Your loan team hasn&apos;t set up a construction holdback for this loan yet.
      </p>
    </div>
  )
}

export default function DrawRequestsSection({ loans = [], selectedLoan = null, onChangeLoan }) {
  const loanId = selectedLoan?.id
  const [draws, setDraws] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!loanId) return
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
    setLoading(true)
    setError('')
    setDraws([])
    setSummary(null)
    setFormOpen(false)
    load()
  }, [load])

  async function handleSubmit(payload, files) {
    const draw = await createDraw(loanId, payload)
    const failed = await uploadFiles(loanId, draw.id, files)
    if (failed.length) {
      setError(`Draw #${draw.number} was submitted, but these files didn't upload: ${failed.join(', ')}. Add them from the draw below.`)
    }
    setFormOpen(false)
    await load()
  }

  if (!selectedLoan) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-500">Draw requests will appear here once you have a loan.</p>
      </div>
    )
  }

  const available = Number(summary?.available ?? 0)
  const hasHoldback = summary?.holdback != null

  return (
    <div className="space-y-6">
      {loans.length > 1 && <PropertySelector properties={loans} selected={selectedLoan} onChange={onChangeLoan} />}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          <button type="button" onClick={() => setError('')} className="font-semibold underline">
            Dismiss
          </button>
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading draws…</p>
      ) : !hasHoldback ? (
        <NotYetAvailableCard />
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Available Funds</h2>
            <p className="mt-1 text-sm text-slate-500">Draws come out of your construction holdback.</p>
            <div className="mt-4">
              <DrawSummaryBar summary={summary} />
            </div>
          </div>

          {formOpen ? (
            <RequestDrawForm available={available} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Need funds for your next milestone?</h2>
                <p className="mt-1 text-sm text-slate-500">Send the amount with photos and invoices of the work done.</p>
              </div>
              <button type="button" onClick={() => setFormOpen(true)} disabled={available <= 0} className={primaryButton}>
                <Plus className="h-4 w-4" />
                Request Draw
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Draw History</h2>
            {draws.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No draws requested yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {draws.map((draw) => (
                  <DrawItem key={draw.id} loanId={loanId} draw={draw} onChanged={load} onError={setError} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
