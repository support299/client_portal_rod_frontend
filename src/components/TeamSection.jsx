import { Phone, Mail, User } from 'lucide-react'

function MemberAvatar({ avatar, name }) {
  if (avatar) {
    return <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
  }
  const initial = name?.trim()?.charAt(0)?.toUpperCase()
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      {initial ? (
        <span className="text-sm font-semibold text-slate-600">{initial}</span>
      ) : (
        <User className="h-5 w-5" />
      )}
    </div>
  )
}

export default function TeamSection({ teamMembers = [] }) {
  return (
    <div>
      <p className="mb-6 text-sm text-slate-500">Borrowers always know who to contact.</p>
      {teamMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-500">Your team will appear here once assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {teamMembers.map((member) => (
            <div key={member.id} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <MemberAvatar avatar={member.avatar} name={member.name} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{member.name ?? '—'}</p>
                  {member.role && (
                    <span className="mt-0.5 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {member.phone && (
                  <a
                    href={`tel:${member.phone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {member.phone}
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {member.email}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
