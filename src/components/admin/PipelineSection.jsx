import { dealHealthConfig } from '../../common/constants/uiStyles'

export const pipelineStages = [
  { key: 'new', label: 'New Application' },
  { key: 'processing', label: 'Processing' },
  { key: 'underwriting', label: 'Underwriting' },
  { key: 'approved', label: 'Approved' },
  { key: 'closing', label: 'Closing' },
  { key: 'funded', label: 'Funded' },
]

function LoanCard({ loan }) {
  const healthClasses = dealHealthConfig[loan.health]?.classes ?? 'bg-slate-100 text-slate-600'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{loan.loanNumber}</p>
        {loan.health && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${healthClasses}`}>
            {loan.health}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">{loan.borrower}</p>
      <p className="text-xs text-slate-400">{loan.address}</p>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
        <span className="font-semibold text-slate-700">{loan.amount}</span>
        <span className="text-slate-400">
          {loan.daysInStage === 0 ? 'New today' : `${loan.daysInStage}d in stage`}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">{loan.officer}</p>
    </div>
  )
}

export default function PipelineSection({ pipelineLoans = [] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
        {pipelineStages.map((stage) => {
          const loans = pipelineLoans.filter((l) => l.stage === stage.key)
          return (
            <div key={stage.key} className="w-72 shrink-0">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-slate-700">{stage.label}</h2>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-600">
                  {loans.length}
                </span>
              </div>
              <div className="space-y-3 rounded-xl bg-slate-100/70 p-2.5">
                {loans.length === 0 ? (
                  <p className="px-1.5 py-3 text-center text-xs text-slate-400">No loans</p>
                ) : (
                  loans.map((loan) => <LoanCard key={loan.id} loan={loan} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
