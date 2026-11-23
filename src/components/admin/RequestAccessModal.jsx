import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Search, X } from 'lucide-react'
import { createAccessRequest, searchLoansForAccess } from '../../api/admin'
import { accessLevelStyles } from '../../common/constants/uiStyles'
import { errorMessage } from '../../utils/errors'
import { LevelPicker } from './RequestAccessCard'

function LoanRow({ loan, onRequested, onClose }) {
  // null: collapsed; otherwise the request form is open
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState(loan.access_level === 'read' ? 'write' : 'read')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const label = loan.loan_number || `Loan #${loan.id}`
  const canRequest = !loan.pending_request && (!loan.has_access || loan.access_level === 'read')

  async function send(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await createAccessRequest({ loan: loan.id, level, message })
      onRequested(loan.id, created.id)
      setOpen(false)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            <span className="tabular-nums">{label}</span>
            {loan.name && loan.name !== label && <span className="font-medium text-slate-700"> · {loan.name}</span>}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {[loan.borrower_name, loan.stage_name, loan.officer_names?.length ? `Team: ${loan.officer_names.join(', ')}` : 'Unassigned']
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {loan.has_access && (
            <>
              {loan.access_level && loan.access_level !== 'officer' && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${accessLevelStyles[loan.access_level][1]}`}>
                  {accessLevelStyles[loan.access_level][0]}
                </span>
              )}
              <Link
                to={`/admin/loans/${loan.id}`}
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Open
              </Link>
            </>
          )}
          {loan.pending_request && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Pending</span>
          )}
          {canRequest && !open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {loan.access_level === 'read' ? 'Request full access' : 'Request access'}
            </button>
          )}
        </div>
      </div>

      {open && (
        <form onSubmit={send} className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3">
          <LevelPicker value={level} onChange={setLevel} name={`level-${loan.id}`} disabled={busy} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Why you need it (optional)"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      )}
    </li>
  )
}

/** Search every loan (seen or not) and ask its team for access. Opened from the Loans page. */
export default function RequestAccessModal({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      searchLoansForAccess(query.trim(), 10)
        .then((data) => {
          if (cancelled) return
          setResults(data?.results ?? [])
          setCount(data?.count ?? 0)
          setError('')
        })
        .catch((err) => !cancelled && setError(errorMessage(err)))
        .finally(() => !cancelled && setLoading(false))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  function markPending(loanId, requestId) {
    setResults((prev) => prev.map((l) => (l.id === loanId ? { ...l, pending_request: requestId } : l)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Request access to a loan"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Request access to a loan</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Find a loan you&rsquo;re not on; its team or an admin decides. Search by loan number, name or borrower.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="LN-2026-0012, 123 Main St, or jane@example.com"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error && <p className="px-5 py-3 text-sm text-red-600">{error}</p>}
          {loading && results.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No loans match.</p>
          ) : (
            <ul className={`divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
              {results.map((loan) => (
                <LoanRow key={loan.id} loan={loan} onRequested={markPending} onClose={onClose} />
              ))}
            </ul>
          )}
        </div>
        {count > results.length && (
          <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
            Showing {results.length} of {count}. Narrow the search to find the rest.
          </p>
        )}
      </div>
    </div>
  )
}
