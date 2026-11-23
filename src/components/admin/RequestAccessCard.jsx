import { useState } from 'react'
import { KeyRound, Lock } from 'lucide-react'
import { createAccessRequest, deleteAccessRequest } from '../../api/admin'
import { accessLevelStyles } from '../../common/constants/uiStyles'
import { errorMessage } from '../../utils/errors'

const card = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6'

// Read-only / Full access choice shared by the card and the Request access modal
export function LevelPicker({ value, onChange, name = 'access-level', disabled = false }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(accessLevelStyles).map(([level, [label]]) => (
        <label
          key={level}
          className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
            value === level ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'
          } ${disabled ? 'opacity-60' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={level}
            checked={value === level}
            disabled={disabled}
            onChange={() => onChange(level)}
            className="mt-0.5 accent-emerald-600"
          />
          <span>
            <span className="block font-semibold text-slate-900">{label}</span>
            <span className="block text-xs text-slate-500">
              {level === 'read'
                ? 'See the loan, its documents, draws, notes and chat.'
                : 'Also edit the loan, upload, request documents, post notes and messages.'}
            </span>
          </span>
        </label>
      ))}
    </div>
  )
}

/**
 * Shown on a loan page the viewer can't open (403 loan_access_required): ask the loan's team
 * for access, or cancel the request already waiting. With `upgrade`, it sits on a loan the
 * viewer may only read and asks for full access instead.
 *
 * loan: {id, loan_number, name}. pendingRequest: id of the open request, or null.
 * onChanged(pendingId | null) after a request is sent or cancelled.
 */
export default function RequestAccessCard({ loan, pendingRequest = null, upgrade = false, onChanged, onCancel }) {
  const [level, setLevel] = useState(upgrade ? 'write' : 'read')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const label = loan.loan_number || `Loan #${loan.id}`
  const title = loan.name && loan.name !== label ? `${label} · ${loan.name}` : label

  async function send(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await createAccessRequest({ loan: loan.id, level, message })
      setSent(true)
      onChanged?.(created.id)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    if (!window.confirm('Cancel your access request?')) return
    setBusy(true)
    setError('')
    try {
      await deleteAccessRequest(pendingRequest)
      onChanged?.(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (upgrade && sent) {
    return (
      <p className="text-sm text-slate-600">
        Request sent. The loan&rsquo;s team or an admin will review it; you&rsquo;ll get a notification.
      </p>
    )
  }

  if (pendingRequest) {
    return (
      <div className={`${card} text-sm`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <KeyRound className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold text-slate-900">{title}</h1>
            <p className="mt-1 text-slate-600">
              Your access request is waiting for the loan&rsquo;s team or an admin. You&rsquo;ll get a
              notification once it&rsquo;s decided.
            </p>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="mt-4 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy ? 'Cancelling…' : 'Cancel request'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const body = (
    <form onSubmit={send} className="space-y-4">
      <LevelPicker value={level} onChange={setLevel} disabled={busy} />
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Why do you need access? (optional)</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="A line for the loan team, e.g. covering while Sam is out."
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
      </label>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? 'Sending…' : upgrade ? 'Request full access' : 'Request access'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )

  if (upgrade) {
    return (
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Request full access</h2>
        {body}
      </div>
    )
  }

  return (
    <div className={card}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Lock className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            You&rsquo;re not on this loan. Ask its team or an admin for access; they&rsquo;ll be notified.
          </p>
          <div className="mt-5">{body}</div>
        </div>
      </div>
    </div>
  )
}
