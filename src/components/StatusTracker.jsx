import { Check } from 'lucide-react'
import { daysUntil } from './NextStep'
import { money } from '../utils/draws'

function StageIcon({ state, number }) {
  if (state === 'complete') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
        <Check className="h-4 w-4" />
      </div>
    )
  }
  if (state === 'current') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-600 bg-white text-xs font-bold text-emerald-700 ring-4 ring-emerald-50">
        {number}
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-xs font-semibold text-slate-400">
      {number}
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold tabular-nums text-slate-900">{value ?? '—'}</p>
    </div>
  )
}

// The deal at a glance: what it is, its key numbers, and where it is in the pipeline
export default function StatusTracker({ detail }) {
  const { loan, stages, stageLabel, stageNote, funded, drawSummary } = detail
  const days = daysUntil(loan.raw?.expected_close_date)

  let third = null
  if (funded && drawSummary?.available != null) {
    third = <Fact label="Rehab funds available" value={money(drawSummary.available)} />
  } else if (!funded && days != null && days >= 0) {
    third = <Fact label="Days to closing" value={days} />
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loan #{loan.id}</p>
          <h2 className="mt-0.5 text-xl font-bold text-slate-900">{loan.loanName}</h2>
        </div>
        {stageLabel && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              funded ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700'
            }`}
          >
            {stageLabel}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
        <Fact label="Loan amount" value={loan.loanAmount} />
        <Fact label={funded ? 'Closing date' : 'Target closing'} value={loan.closingDate} />
        {third}
      </div>

      {stages.length > 0 && (
        // Eight steps don't fit a phone; scroll sideways instead of overflowing the card
        <ol aria-label="Loan progress" className="-mx-5 mt-6 flex min-w-0 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
          {stages.map((stage, i) => (
            <li key={stage.key} className="flex min-w-[96px] flex-1 items-start last:flex-none">
              <div className="flex w-[96px] flex-col items-center gap-2 text-center">
                <StageIcon state={stage.state} number={i + 1} />
                <span
                  aria-current={stage.state === 'current' ? 'step' : undefined}
                  className={`text-xs leading-tight ${
                    stage.state === 'current'
                      ? 'font-bold text-emerald-700'
                      : stage.state === 'complete'
                        ? 'font-medium text-slate-700'
                        : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div
                  className={`mt-4 h-0.5 min-w-[12px] flex-1 ${stage.state === 'complete' ? 'bg-emerald-600' : 'bg-slate-200'}`}
                />
              )}
            </li>
          ))}
        </ol>
      )}

      {stageNote && (
        <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{stageLabel}:</span> {stageNote}
        </p>
      )}
    </section>
  )
}
