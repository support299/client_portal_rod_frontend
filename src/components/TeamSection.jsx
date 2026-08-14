import { Phone, Mail } from 'lucide-react'
import { teamMembers } from '../data/dashboardData'

export default function TeamSection() {
  return (
    <div>
      <p className="mb-6 text-sm text-slate-500">Borrowers always know who to contact.</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {teamMembers.map((member) => (
        <div key={member.id} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <img
              src={member.avatar}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">{member.name}</p>
              <span className="mt-0.5 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {member.role}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <a
              href={`tel:${member.phone.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
            >
              <Phone className="h-4 w-4 shrink-0" />
              {member.phone}
            </a>
            <a
              href={`mailto:${member.email}`}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
            >
              <Mail className="h-4 w-4 shrink-0" />
              {member.email}
            </a>
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}
