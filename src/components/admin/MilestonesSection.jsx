import { useState } from 'react'
import { CircleCheck, Clock, Circle } from 'lucide-react'
import { milestoneStatusStyles } from '../../common/constants/uiStyles'

const statusIcons = { CircleCheck, Clock, Circle }

function LoanMilestones({ loanNumber, milestones: initial }) {
  const [milestones, setMilestones] = useState(initial)

  const advance = (index) => {
    setMilestones((prev) =>
      prev.map((m, i) => {
        if (i < index) return { ...m, status: 'complete' }
        if (i === index) return { ...m, status: 'current', date: m.date === '—' ? 'In progress' : m.date }
        return { ...m, status: 'upcoming' }
      }),
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{loanNumber}</h2>
      <p className="mt-1 text-sm text-slate-500">
        Click a milestone to mark the loan&apos;s current stage.
      </p>

      <ol className="mt-4 space-y-1">
        {milestones.map((m, index) => {
          const config = milestoneStatusStyles[m.status]
          const Icon = config ? statusIcons[config.icon] : Circle
          return (
            <li key={m.key}>
              <button
                type="button"
                onClick={() => advance(index)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config?.classes ?? 'bg-slate-100 text-slate-500'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p
                    className={`text-sm ${m.status === 'upcoming' ? 'text-slate-400' : 'font-semibold text-slate-900'}`}
                  >
                    {m.label}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{m.date}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function MilestonesSection({ milestonesByLoan = {} }) {
  const entries = Object.entries(milestonesByLoan)

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-500">Milestone tracking will appear when loans are active.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {entries.map(([loanNumber, milestones]) => (
        <LoanMilestones key={loanNumber} loanNumber={loanNumber} milestones={milestones} />
      ))}
    </div>
  )
}
