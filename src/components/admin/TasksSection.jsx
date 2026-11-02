import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, CircleCheck, FileCheck2, FileText, RefreshCw } from 'lucide-react'
import { fetchTasks } from '../../api/admin'
import { useAuth } from '../../common/auth/AuthContext'
import { DocumentRow } from './LoanDocuments'
import { drawStatusLabel, money } from '../../utils/draws'
import { errorMessage } from '../../utils/errors'
import { timeAgo } from '../../utils/format'

// Keyed by task type: [icon, icon classes, loan page section it opens]
const taskTypes = {
  document_review: [FileCheck2, 'bg-blue-50 text-blue-600', 'documents'],
  file_review: [FileText, 'bg-violet-50 text-violet-600', 'documents'],
  draw_review: [Banknote, 'bg-amber-50 text-amber-600', 'draws'],
}

const typeFilters = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'documents', label: 'Documents', match: (t) => t.type !== 'draw_review' },
  { id: 'draws', label: 'Draws', match: (t) => t.type === 'draw_review' },
]

const chip = (active) =>
  `rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
    active ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
  }`

function LoanLine({ task, children }) {
  const section = taskTypes[task.type]?.[2] ?? 'overview'
  return (
    <p className="text-xs text-slate-500">
      <Link to={`/admin/loans/${task.loan.id}#${section}`} className="font-semibold text-emerald-700 hover:underline">
        {task.loan.name}
      </Link>
      {task.loan.borrower && <> &middot; {task.loan.borrower}</>}
      {' '}&middot; {children}
    </p>
  )
}

function OpenTask({ task, onChanged, onError }) {
  const [Icon, iconClasses] = taskTypes[task.type] ?? taskTypes.file_review

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClasses}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{task.title}</p>
            <LoanLine task={task}>{timeAgo(task.at)}</LoanLine>
          </div>
        </div>

        {task.type === 'draw_review' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-slate-900">{money(task.amount)}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {drawStatusLabel(task.draw_status)}
            </span>
            <Link
              to={`/admin/loans/${task.loan.id}#draws`}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Open draw
            </Link>
          </div>
        )}
      </div>

      {task.files?.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 sm:pl-12">
          {task.files.map((doc) => (
            <DocumentRow key={doc.id} loanId={task.loan.id} doc={doc} onChanged={onChanged} onError={onError} />
          ))}
        </ul>
      )}
      {task.type === 'document_review' && !task.files?.length && (
        <p className="mt-3 text-xs text-slate-500 sm:pl-12">
          No unreviewed file on this request.{' '}
          <Link to={`/admin/loans/${task.loan.id}#documents`} className="font-semibold text-emerald-700 hover:underline">
            Open it on the loan
          </Link>{' '}
          to mark it complete or ask for a new file.
        </p>
      )}
    </li>
  )
}

export default function TasksSection() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [scope, setScope] = useState('mine')
  const [view, setView] = useState('open')
  const [type, setType] = useState('all')
  const [data, setData] = useState({ open: [], done: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setData(await fetchTasks(scope))
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  // Borrowers keep uploading while the page is open; catch up when the tab comes back into focus
  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const match = typeFilters.find((f) => f.id === type).match
  const tasks = (view === 'open' ? data.open : data.done).filter(match)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setView('open')} className={chip(view === 'open')}>
            To review ({data.open.length})
          </button>
          <button type="button" onClick={() => setView('done')} className={chip(view === 'done')}>
            Done, last 14 days
          </button>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          {typeFilters.map((f) => (
            <button key={f.id} type="button" onClick={() => setType(f.id)} className={chip(type === f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              aria-label="Whose loans"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none"
            >
              <option value="mine">My loans</option>
              <option value="all">All loans</option>
            </select>
          )}
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
          <button type="button" onClick={() => setError('')} className="font-semibold underline">
            Dismiss
          </button>
        </p>
      )}

      {loading && !data.open.length && !data.done.length ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <CircleCheck className="h-8 w-8 text-emerald-500" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {view === 'open' ? 'You’re all caught up' : 'Nothing reviewed in the last 14 days'}
          </p>
          {view === 'open' && (
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              When a borrower uploads a requested document or submits a draw on
              {scope === 'all' ? ' any loan' : ' one of your loans'}, it shows up here for review.
            </p>
          )}
        </div>
      ) : view === 'open' ? (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <OpenTask key={task.id} task={task} onChanged={load} onError={setError} />
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4 sm:px-5">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3 py-3">
              <CircleCheck
                className={`mt-0.5 h-4 w-4 shrink-0 ${task.outcome === 'rejected' ? 'text-red-500' : 'text-emerald-500'}`}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
                <LoanLine task={task}>
                  {task.by ? `${task.by}, ` : ''}
                  {timeAgo(task.at)}
                </LoanLine>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
