import { Upload, MessageSquare, Download, CalendarClock } from 'lucide-react'

const actions = [
  { label: 'Upload Documents', icon: Upload, section: 'documents' },
  { label: 'Message My Loan Officer', icon: MessageSquare, section: 'messages' },
  { label: 'Download Documents', icon: Download, section: 'documents' },
  { label: 'Schedule a Call', icon: CalendarClock, section: 'calendar' },
]

export default function QuickActions({ onNavigate }) {
  return (
    <div className="w-full shrink-0 rounded-xl border border-slate-200 bg-white p-[7px] shadow-sm lg:w-[260px]">
      <p className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Quick Actions
      </p>
      <div className="flex flex-col divide-y divide-slate-100">
        {actions.map(({ label, icon: Icon, section }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(section)}
            className="flex items-center gap-2 px-2 py-[9px] text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Icon className="h-[14px] w-[14px] shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
