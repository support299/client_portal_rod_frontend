import { useState } from 'react'
import { Mail, MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function CommunicationsSection({ communicationsByBorrower = {} }) {
  const borrowers = Object.keys(communicationsByBorrower)
  const [selected, setSelected] = useState(borrowers[0] ?? null)
  const record = selected ? communicationsByBorrower[selected] : null

  const timeline = record
    ? [
        ...(record.emails ?? []).map((e) => ({ ...e, kind: 'email' })),
        ...(record.sms ?? []).map((s) => ({ ...s, kind: 'sms' })),
      ]
    : []

  if (borrowers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-500">Communications will appear here when messages are logged.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap gap-2">
        {borrowers.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setSelected(name)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              selected === name
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {timeline.length === 0 ? (
        <p className="mt-5 text-sm text-slate-400">No communications for this borrower.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {timeline.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="flex items-start gap-3 py-3.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  item.kind === 'email' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                }`}
              >
                {item.kind === 'email' ? (
                  <Mail className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {item.direction === 'outbound' ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ArrowDownLeft className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <p className="text-sm font-semibold text-slate-900">
                    {item.kind === 'email' ? item.subject : item.text}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {item.with} &middot; {item.timestamp}
                </p>
                {item.kind === 'email' && item.preview && (
                  <p className="mt-1 text-sm text-slate-600">{item.preview}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
