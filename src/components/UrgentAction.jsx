import { AlertTriangle, FileUp } from 'lucide-react'
import { urgentAction } from '../data/dashboardData'

export default function UrgentAction() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="text-base font-semibold">Urgent: Action Required</h2>
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 ring-1 ring-red-100">
            <FileUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{urgentAction.title}</p>
            <p className="text-sm font-medium text-red-600">{urgentAction.subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
        >
          Upload
        </button>
      </div>
    </div>
  )
}
