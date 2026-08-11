import { recentActivity } from '../data/dashboardData'

export default function RecentActivity() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>

      <ul className="mt-4 space-y-4">
        {recentActivity.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                item.done ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-400">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
