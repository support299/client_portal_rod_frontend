import { Link } from 'react-router-dom'
import { Landmark, CheckSquare, FileWarning, ChevronRight } from 'lucide-react'
import { pipelineStages } from './PipelineSection'

const taskPriorityStyles = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-slate-100 text-slate-600',
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
      <Icon className="absolute bottom-4 right-4 h-8 w-8 text-emerald-100" />
    </div>
  )
}

function SectionCard({ title, viewAllTo, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <Link
          to={viewAllTo}
          className="flex items-center gap-0.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </div>
  )
}

export default function AdminOverview({
  pipelineLoans = [],
  tasks = [],
  missingDocuments = [],
  recentUploads = [],
  staffUser = null,
}) {
  const openTasksCount = tasks.filter((t) => t.status !== 'Done').length
  const staffName = staffUser?.name ?? ''
  const myTasks = tasks
    .filter((t) => (staffName ? t.assignee === staffName : true) && t.status !== 'Done')
    .slice(0, 4)

  const pipelineTotal = pipelineLoans.length || 1

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active Loans" value={pipelineLoans.length} icon={Landmark} />
        <StatCard label="Open Tasks" value={openTasksCount} icon={CheckSquare} />
        <StatCard label="Missing Documents" value={missingDocuments.length} icon={FileWarning} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Pipeline Snapshot</h2>
              <Link
                to="/admin/pipeline"
                className="flex items-center gap-0.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View pipeline
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {pipelineStages.map((stage) => {
                const count = pipelineLoans.filter((l) => l.stage === stage.key).length
                const pct = Math.round((count / pipelineTotal) * 100)
                return (
                  <li key={stage.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{stage.label}</span>
                      <span className="text-slate-400">{count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <SectionCard title="My Tasks" viewAllTo="/admin/tasks">
            <ul className="mt-4 divide-y divide-slate-100">
              {myTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      {task.loanNumber} &middot; {task.borrower} &middot; Due {task.dueDate}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${taskPriorityStyles[task.priority] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {task.priority}
                  </span>
                </li>
              ))}
              {myTasks.length === 0 && (
                <li className="py-4 text-center text-sm text-slate-400">You&apos;re all caught up.</li>
              )}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Missing Documents" viewAllTo="/admin/documents">
            {missingDocuments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No missing documents.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {missingDocuments.slice(0, 4).map((doc) => (
                  <li key={doc.id} className="py-3">
                    <p className="text-sm font-semibold text-slate-900">{doc.document}</p>
                    <p className="text-xs text-slate-400">
                      {doc.borrower} &middot; {doc.daysOutstanding}d outstanding
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Recent Uploads" viewAllTo="/admin/documents">
            {recentUploads.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No recent uploads.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {recentUploads.slice(0, 4).map((file) => (
                  <li key={file.id} className="py-3">
                    <p className="text-sm font-semibold text-slate-900">{file.fileName}</p>
                    <p className="text-xs text-slate-400">
                      {file.borrower} &middot; {file.uploadedAt}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
