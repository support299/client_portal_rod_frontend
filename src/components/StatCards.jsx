import { DollarSign, Percent, CalendarClock, Receipt } from 'lucide-react'

export default function StatCards({ property }) {
  if (!property) return null

  const stats = [
    { label: 'Loan Amount', value: property.loanAmount, icon: DollarSign },
    { label: 'Rate Lock', value: property.rateLock, icon: Percent },
    { label: 'Estimated Closing Date', value: property.estimatedEndDate, icon: CalendarClock },
    { label: 'Total Due', value: property.totalDue, icon: Receipt },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{value ?? '—'}</p>
          <Icon className="absolute bottom-4 right-4 h-8 w-8 text-emerald-100" />
        </div>
      ))}
    </div>
  )
}
