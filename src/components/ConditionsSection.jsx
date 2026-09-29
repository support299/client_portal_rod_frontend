import { CircleCheck, Clock, CircleX, Upload } from 'lucide-react'
import { conditionStatusStyles } from '../common/constants/uiStyles'

const icons = { CircleCheck, Clock, CircleX }

export default function ConditionsSection({ conditionsList = [] }) {
  const outstandingCount = conditionsList.filter((c) => c.status !== 'Complete').length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Outstanding Conditions</h2>
        {conditionsList.length > 0 && (
          <span className="text-xs font-medium text-slate-400">
            {outstandingCount} of {conditionsList.length} remaining
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">Borrowers know exactly what&apos;s missing.</p>

      {conditionsList.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">No conditions on file yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {conditionsList.map((condition) => {
            const config = conditionStatusStyles[condition.status]
            const Icon = config ? icons[config.icon] : Clock
            const needsAction = condition.status !== 'Complete'

            return (
              <li
                key={condition.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config?.classes ?? 'bg-slate-100 text-slate-500'}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold text-slate-900">{condition.name}</p>
                </div>

                <div className="flex items-center gap-3">
                  {condition.status && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config?.classes ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {condition.status}
                    </span>
                  )}
                  {needsAction && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
