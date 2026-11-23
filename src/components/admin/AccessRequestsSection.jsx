import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, KeyRound, RefreshCw, X } from 'lucide-react'
import {
  decideAccessRequest, deleteAccessRequest, fetchAccessRequests, setAccessLevel,
} from '../../api/admin'
import { accessLevelStyles, accessStatusStyles } from '../../common/constants/uiStyles'
import { errorMessage } from '../../utils/errors'
import { formatDate, timeAgo } from '../../utils/format'
import RequestAccessModal from './RequestAccessModal'

const statusFilters = ['pending', 'approved', 'denied', 'revoked']

const chip = (active) =>
  `rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
    active ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
  }`

const smallButton =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60'

function Badge({ styles, value }) {
  const [label, classes] = styles[value] ?? [value, 'bg-slate-100 text-slate-600']
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>{label}</span>
}

function RequestRow({ request, onChanged, onError }) {
  const [busy, setBusy] = useState(false)
  // 'approve' | 'deny' | null: which decision form is open
  const [deciding, setDeciding] = useState(null)
  const [level, setLevel] = useState(request.requested_level)
  const [note, setNote] = useState('')

  const loanLabel = request.loan_number || `Loan #${request.loan}`
  const pending = request.status === 'pending'
  const approved = request.status === 'approved'

  async function run(action) {
    setBusy(true)
    try {
      await action()
      onChanged()
    } catch (err) {
      onError(errorMessage(err))
      setBusy(false)
    }
  }

  function decide(e) {
    e.preventDefault()
    run(() => decideAccessRequest(request.id, deciding, { level: deciding === 'approve' ? level : undefined, note }))
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {request.requester?.full_name}
            <span className="font-normal text-slate-500"> asks for </span>
            <Badge styles={accessLevelStyles} value={request.requested_level} />
            <span className="font-normal text-slate-500"> to </span>
            <Link to={`/admin/loans/${request.loan}`} className="text-emerald-700 hover:underline">
              <span className="tabular-nums">{loanLabel}</span>
              {request.loan_name && request.loan_name !== loanLabel && ` · ${request.loan_name}`}
            </Link>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {[
              request.loan_borrower?.full_name && `Borrower ${request.loan_borrower.full_name}`,
              `Asked ${timeAgo(request.created_at)}`,
              request.decided_at && `${request.status === 'denied' ? 'Denied' : 'Approved'} by ${request.decided_by?.full_name ?? 'someone'} ${timeAgo(request.decided_at)}`,
              request.revoked_at && `Revoked by ${request.revoked_by?.full_name ?? 'someone'} on ${formatDate(request.revoked_at)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {request.message && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">“{request.message}”</p>}
          {request.decision_note && (
            <p className="mt-1 text-xs text-slate-500">Note from the team: {request.decision_note}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge styles={accessStatusStyles} value={request.status} />
          {approved && (
            <span className="text-xs text-slate-500">
              granted <Badge styles={accessLevelStyles} value={request.level} />
            </span>
          )}

          {pending && request.can_decide && !deciding && (
            <>
              <button type="button" disabled={busy} onClick={() => setDeciding('deny')} className={smallButton}>
                <X className="mr-1 inline h-3.5 w-3.5" />
                Deny
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setDeciding('approve')}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Check className="mr-1 inline h-3.5 w-3.5" />
                Approve
              </button>
            </>
          )}
          {pending && request.is_mine && (
            <button
              type="button"
              disabled={busy}
              onClick={() => window.confirm('Cancel your access request?') && run(() => deleteAccessRequest(request.id))}
              className={smallButton}
            >
              Cancel request
            </button>
          )}
          {approved && request.can_decide && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => setAccessLevel(request.id, request.level === 'read' ? 'write' : 'read'))}
                className={smallButton}
              >
                {request.level === 'read' ? 'Give full access' : 'Make read-only'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  window.confirm(`Revoke ${request.requester?.full_name}'s access to ${loanLabel}?`)
                  && run(() => deleteAccessRequest(request.id))}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Revoke
              </button>
            </>
          )}
        </div>
      </div>

      {deciding && (
        <form onSubmit={decide} className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3">
          {deciding === 'approve' && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-slate-700">Grant</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
              >
                {Object.entries(accessLevelStyles).map(([value, [label]]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {level !== request.requested_level && (
                <span className="text-xs text-slate-500">(they asked for {accessLevelStyles[request.requested_level][0].toLowerCase()})</span>
              )}
            </div>
          )}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            placeholder={deciding === 'approve' ? 'Note for the requester (optional)' : 'Why not? (optional, sent to the requester)'}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => setDeciding(null)} className={smallButton}>
              Back
            </button>
            <button
              type="submit"
              disabled={busy}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 ${
                deciding === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {busy ? 'Saving…' : deciding === 'approve' ? `Approve as ${accessLevelStyles[level][0].toLowerCase()}` : 'Deny request'}
            </button>
          </div>
        </form>
      )}
    </li>
  )
}

/**
 * Access requests: what teammates asked for on your loans (officers) or on every loan
 * (admins), and your own requests. Approve, deny, change the level or revoke here.
 */
export default function AccessRequestsSection() {
  const [status, setStatus] = useState('pending')
  const [mine, setMine] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await fetchAccessRequests({ status, mine: mine ? 'true' : '' })
      setItems(Array.isArray(data) ? data : data?.results ?? [])
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status, mine])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)} className={chip(status === s)}>
              {accessStatusStyles[s][0]}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <button type="button" onClick={() => setMine((v) => !v)} className={chip(mine)} aria-pressed={mine}>
            Mine only
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRequesting(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <KeyRound className="h-4 w-4" />
            Request access
          </button>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              load()
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          <button type="button" onClick={() => setError('')} className="font-semibold underline">Dismiss</button>
        </p>
      )}

      {loading && items.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <KeyRound className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {status === 'pending' ? 'No requests waiting' : `No ${status} requests`}
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {status === 'pending'
              ? 'When a teammate asks to see one of your loans, or you ask to see one of theirs, it shows up here.'
              : 'Change the filter above to see other requests.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((request) => (
            <RequestRow key={request.id} request={request} onChanged={load} onError={setError} />
          ))}
        </ul>
      )}

      {requesting && (
        <RequestAccessModal
          onClose={() => {
            setRequesting(false)
            load()
          }}
        />
      )}
    </div>
  )
}
