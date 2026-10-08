import { Hourglass, Check, Lock } from 'lucide-react'

function StageIcon({ state }) {
  if (state === 'complete') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white sm:h-10 sm:w-10">
        <Check className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
    )
  }
  if (state === 'current') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-600 bg-white sm:h-10 sm:w-10">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
      </div>
    )
  }
  if (state === 'locked') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-300 sm:h-10 sm:w-10">
        <Lock className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </div>
    )
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-300 sm:h-10 sm:w-10">
      <span className="text-lg leading-none">&hellip;</span>
    </div>
  )
}

export default function StatusTracker({ loanStages = [], currentStatus = null, stageName = '' }) {
  if (!currentStatus && !stageName && loanStages.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">
          Loan status will appear here once your application is in progress.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-2xl">
            <Hourglass className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Current Status
            </p>
            <p className="text-base font-semibold text-slate-900">
              {stageName || currentStatus?.label || '—'}
            </p>
          </div>
        </div>
        {currentStatus?.badge && (
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
            {currentStatus.badge}
          </span>
        )}
      </div>

      {loanStages.length > 0 && (
        // Seven steps don't fit a phone; scroll sideways instead of overflowing the card
        <div className="-mx-5 mt-8 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
          <div className="flex min-w-[640px] items-start">
            {loanStages.map((stage, i) => (
              <div key={stage.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <StageIcon state={stage.state} />
                  <span
                    className={`whitespace-nowrap text-[11px] font-medium sm:text-sm ${
                      stage.state === 'complete' || stage.state === 'current'
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
                {i < loanStages.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 sm:mx-2 ${
                      stage.state === 'complete' ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
