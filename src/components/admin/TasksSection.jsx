import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote, CircleCheck, ClipboardList, FileCheck2, FileText, Pencil, Plus, RefreshCw, Trash2, X,
} from 'lucide-react'
import {
  createStaffTask, deleteStaffTask, fetchLoans, fetchTasks, fetchUsers, updateStaffTask,
} from '../../api/admin'
import { useAuth } from '../../common/auth/AuthContext'
import { DocumentRow } from './LoanDocuments'
import { drawStatusLabel, money } from '../../utils/draws'
import { errorMessage } from '../../utils/errors'
import { formatDate, timeAgo } from '../../utils/format'

// Keyed by task type: [icon, icon classes, loan page section it opens]
const taskTypes = {
  document_review: [FileCheck2, 'bg-blue-50 text-blue-600', 'documents'],
  file_review: [FileText, 'bg-violet-50 text-violet-600', 'documents'],
  draw_review: [Banknote, 'bg-amber-50 text-amber-600', 'draws'],
  manual: [ClipboardList, 'bg-emerald-50 text-emerald-600', 'overview'],
}

const typeFilters = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'documents', label: 'Documents', match: (t) => t.type === 'document_review' || t.type === 'file_review' },
  { id: 'draws', label: 'Draws', match: (t) => t.type === 'draw_review' },
  { id: 'todos', label: 'To-dos', match: (t) => t.type === 'manual' },
]

const chip = (active) =>
  `rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
    active ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
  }`

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none'

const isOverdue = (dueDate) => dueDate && new Date(`${dueDate}T23:59:59`) < Date.now()

function LoanLine({ task, children }) {
  const section = taskTypes[task.type]?.[2] ?? 'overview'
  return (
    <p className="text-xs text-slate-500">
      {task.loan && (
        <>
          <Link to={`/admin/loans/${task.loan.id}#${section}`} className="font-semibold text-emerald-700 hover:underline">
            {task.loan.name}
          </Link>
          {task.loan.borrower && <> &middot; {task.loan.borrower}</>}
          {' '}&middot;{' '}
        </>
      )}
      {children}
    </p>
  )
}

// Searches loans by name; value is {id, name} or null.
function LoanPicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => {
      fetchLoans({ search: query, page_size: 8 })
        .then((data) => setResults(data?.results ?? []))
        .catch(() => setResults([]))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, open])

  if (value) {
    return (
      <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
        <span className="truncate font-medium text-slate-700">{value.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove loan"
          className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search loans… (optional)"
        className={inputClass}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((loan) => (
            <li key={loan.id}>
              <button
                type="button"
                onMouseDown={() => onChange({ id: loan.id, name: loan.name })}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50"
              >
                {loan.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TaskModal({ task, onClose, onSaved }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: task?.title ?? '',
    note: task?.note ?? '',
    due_date: task?.due_date ?? '',
    assigned_to_id: task?.assigned_to?.id ?? user?.id ?? '',
  })
  const [loan, setLoan] = useState(task?.loan ?? null)
  const [staff, setStaff] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && !saving && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  useEffect(() => {
    fetchUsers({ staff: 'true', is_active: 'true', page_size: 100 })
      .then((data) => setStaff(data?.results ?? []))
      .catch((err) => setError(errorMessage(err)))
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      title: form.title.trim(),
      note: form.note.trim(),
      due_date: form.due_date || null,
      loan: loan?.id ?? null,
      assigned_to_id: Number(form.assigned_to_id),
    }
    try {
      if (task) await updateStaffTask(task.task, payload)
      else await createStaffTask(payload)
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => !saving && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={task ? 'Edit task' : 'New task'}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900">{task ? 'Edit task' : 'New task'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label htmlFor="task-title" className="text-xs font-medium text-slate-500">Task</label>
            <input
              id="task-title"
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Follow up with the title company"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-assignee" className="text-xs font-medium text-slate-500">Assign to</label>
              <select
                id="task-assignee"
                name="assigned_to_id"
                required
                value={form.assigned_to_id}
                onChange={handleChange}
                className={inputClass}
              >
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name?.trim() || member.email}
                    {member.id === user?.id ? ' (me)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="task-due" className="text-xs font-medium text-slate-500">Due date (optional)</label>
              <input id="task-due" name="due_date" type="date" value={form.due_date} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Loan</span>
            <LoanPicker value={loan} onChange={setLoan} />
          </div>
          <div>
            <label htmlFor="task-note" className="text-xs font-medium text-slate-500">Note (optional)</label>
            <textarea id="task-note" name="note" rows={3} value={form.note} onChange={handleChange} className={inputClass} />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : task ? 'Save' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  )
}

function OpenTask({ task, onChanged, onError, onEdit }) {
  const [Icon, iconClasses] = taskTypes[task.type] ?? taskTypes.file_review
  const [busy, setBusy] = useState(false)

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

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClasses}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{task.title}</p>
            <LoanLine task={task}>
              {task.type === 'manual' && task.assigned_to?.full_name && <>for {task.assigned_to.full_name} &middot; </>}
              {timeAgo(task.at)}
            </LoanLine>
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

        {task.type === 'manual' && (
          <div className="flex items-center gap-2">
            {task.due_date && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isOverdue(task.due_date) ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isOverdue(task.due_date) ? 'Overdue ' : 'Due '}
                {formatDate(task.due_date)}
              </span>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => onEdit(task)}
              aria-label="Edit task"
              title="Edit"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => window.confirm('Delete this task?') && run(() => deleteStaffTask(task.task))}
              aria-label="Delete task"
              title="Delete"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => updateStaffTask(task.task, { completed: true }))}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <CircleCheck className="h-3.5 w-3.5" />
              Mark done
            </button>
          </div>
        )}
      </div>

      {task.type === 'manual' && task.note && (
        <p className="mt-3 whitespace-pre-wrap text-xs text-slate-500 sm:pl-12">{task.note}</p>
      )}
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
  // null: closed; 'new': creating; a task object: editing it
  const [modal, setModal] = useState(null)

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
            To do ({data.open.length})
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
          <button
            type="button"
            onClick={() => setModal('new')}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New task
          </button>
          {isAdmin && (
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              aria-label="Whose tasks"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none"
            >
              <option value="mine">Mine</option>
              <option value="all">Everyone&rsquo;s</option>
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
            {view === 'open' ? 'You’re all caught up' : 'Nothing done in the last 14 days'}
          </p>
          {view === 'open' && (
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              When a borrower uploads a requested document or submits a draw on
              {scope === 'all' ? ' any loan' : ' one of your loans'}, or a task is assigned to
              {scope === 'all' ? ' anyone' : ' you'}, it shows up here.
            </p>
          )}
        </div>
      ) : view === 'open' ? (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <OpenTask key={task.id} task={task} onChanged={load} onError={setError} onEdit={setModal} />
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

      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            load()
          }}
        />
      )}
    </div>
  )
}
