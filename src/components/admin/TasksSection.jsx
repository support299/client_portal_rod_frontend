import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, X } from 'lucide-react'
import { pipelineStages } from './PipelineSection'
import { dealHealthConfig } from '../../common/constants/uiStyles'

const taskStatusStyles = {
  Open: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  Done: 'bg-emerald-100 text-emerald-700',
}

const taskPriorityStyles = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-slate-100 text-slate-600',
}

const healthOptions = Object.keys(dealHealthConfig)

const emptyLoanForm = {
  loanNumber: '',
  borrower: '',
  address: '',
  amount: '',
  stage: pipelineStages[0].key,
  officer: '',
  health: healthOptions[0],
}

export default function TasksSection() {
  const [tasks, setTasks] = useState([])
  const [pipelineLoans, setPipelineLoans] = useState([])
  const [filter, setFilter] = useState('All')
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [loanForm, setLoanForm] = useState(emptyLoanForm)

  const assigneeOptions = useMemo(() => {
    const names = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))]
    return ['All', ...names]
  }, [tasks])

  const filteredTasks = useMemo(
    () => (filter === 'All' ? tasks : tasks.filter((t) => t.assignee === filter)),
    [filter, tasks],
  )

  const openCount = tasks.filter((t) => t.status !== 'Done').length

  function handleLoanChange(e) {
    const { name, value } = e.target
    setLoanForm((f) => ({ ...f, [name]: value }))
  }

  function handleLoanSubmit(e) {
    e.preventDefault()
    if (!loanForm.loanNumber.trim() || !loanForm.borrower.trim()) return

    setPipelineLoans((list) => [
      ...list,
      {
        id: list.length ? Math.max(...list.map((l) => l.id)) + 1 : 1,
        loanNumber: loanForm.loanNumber.trim(),
        borrower: loanForm.borrower.trim(),
        address: loanForm.address.trim(),
        amount: loanForm.amount.trim(),
        stage: loanForm.stage,
        officer: loanForm.officer,
        daysInStage: 0,
        health: loanForm.health,
      },
    ])
    setLoanForm(emptyLoanForm)
    setShowLoanForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowLoanForm(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Landmark className="h-4 w-4" />
          Create a Loan
        </button>
      </div>

      {showLoanForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowLoanForm(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Create a Loan</h2>
              <button
                type="button"
                onClick={() => setShowLoanForm(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLoanSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="loanNumber" className="text-xs font-medium text-slate-500">Loan Number</label>
                <input
                  id="loanNumber"
                  name="loanNumber"
                  type="text"
                  required
                  value={loanForm.loanNumber}
                  onChange={handleLoanChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="#5012"
                />
              </div>
              <div>
                <label htmlFor="borrower" className="text-xs font-medium text-slate-500">Borrower</label>
                <input
                  id="borrower"
                  name="borrower"
                  type="text"
                  required
                  value={loanForm.borrower}
                  onChange={handleLoanChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="Borrower name"
                />
              </div>
              <div>
                <label htmlFor="address" className="text-xs font-medium text-slate-500">Property Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={loanForm.address}
                  onChange={handleLoanChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label htmlFor="amount" className="text-xs font-medium text-slate-500">Loan Amount</label>
                <input
                  id="amount"
                  name="amount"
                  type="text"
                  value={loanForm.amount}
                  onChange={handleLoanChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="$450,000"
                />
              </div>
              <div>
                <label htmlFor="stage" className="text-xs font-medium text-slate-500">Stage</label>
                <select
                  id="stage"
                  name="stage"
                  value={loanForm.stage}
                  onChange={handleLoanChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                >
                  {pipelineStages.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="officer" className="text-xs font-medium text-slate-500">Loan Officer</label>
                <input
                  id="officer"
                  name="officer"
                  type="text"
                  value={loanForm.officer}
                  onChange={handleLoanChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="Loan officer"
                />
              </div>
              <div>
                <label htmlFor="health" className="text-xs font-medium text-slate-500">Deal Health</label>
                <select
                  id="health"
                  name="health"
                  value={loanForm.health}
                  onChange={handleLoanChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                >
                  {healthOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowLoanForm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Create Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            {openCount} open task{openCount === 1 ? '' : 's'} across the team
          </h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none"
          >
            {assigneeOptions.map((name) => (
              <option key={name} value={name}>
                {name === 'All' ? 'All Team Members' : name}
              </option>
            ))}
          </select>
        </div>

        <ul className="mt-4 divide-y divide-slate-100">
          {filteredTasks.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div>
                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  <Link
                    to={`/admin/loans/${task.loanNumber.replace('#', '')}`}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    {task.loanNumber}
                  </Link>{' '}
                  &middot; {task.borrower} &middot; Assigned to {task.assignee}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Due {task.dueDate}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${taskPriorityStyles[task.priority] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {task.priority}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${taskStatusStyles[task.status] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {task.status}
                </span>
              </div>
            </li>
          ))}
          {filteredTasks.length === 0 && (
            <li className="py-6 text-center text-sm text-slate-400">No tasks for this filter.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
