import { Mail, CalendarClock } from 'lucide-react'
import { assignedOfficer } from '../data/dashboardData'

export default function AssignedOfficer() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Assigned Officer</h2>

      <div className="mt-4 flex items-center gap-3">
        <img
          src={assignedOfficer.avatar}
          alt=""
          className="h-12 w-12 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-slate-900">{assignedOfficer.name}</p>
          <p className="text-sm text-slate-500">{assignedOfficer.title}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          <Mail className="h-4 w-4" />
          Message Sarah
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <CalendarClock className="h-4 w-4" />
          Schedule Call
        </button>
      </div>
    </div>
  )
}
