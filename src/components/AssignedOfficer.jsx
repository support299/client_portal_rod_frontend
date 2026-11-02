import { Mail, MessageSquare, Phone, User } from 'lucide-react'

function OfficerAvatar({ avatar, name }) {
  if (avatar) {
    return <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
  }
  const initial = name?.trim()?.charAt(0)?.toUpperCase()
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
      {initial ? <span className="text-sm font-bold">{initial}</span> : <User className="h-5 w-5" />}
    </div>
  )
}

export default function AssignedOfficer({ officer = null, onMessage }) {
  const name = officer?.name ?? ''
  const firstName = name.split(' ')[0]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Your loan officer</h2>

      {officer ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <OfficerAvatar avatar={officer.avatar} name={name} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{name}</p>
              <p className="text-sm text-slate-500">Loan officer</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onMessage}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <MessageSquare className="h-4 w-4" />
            Message {firstName || 'your loan officer'}
          </button>

          <div className="mt-4 space-y-1.5 text-sm text-slate-600">
            {officer.phone && (
              <a href={`tel:${officer.phone}`} className="flex items-center gap-2 hover:text-emerald-700">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="tabular-nums">{officer.phone}</span>
              </a>
            )}
            {officer.email && (
              <a href={`mailto:${officer.email}`} className="flex min-w-0 items-center gap-2 hover:text-emerald-700">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{officer.email}</span>
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          A loan officer will be assigned to your loan soon. You can still send your loan team a message.
        </p>
      )}
    </div>
  )
}
