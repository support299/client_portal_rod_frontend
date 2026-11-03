import { User } from 'lucide-react'
import { useAuth } from '../common/auth/AuthContext'

function Card({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function FieldRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="break-all text-right text-sm font-semibold text-slate-900">{value || '—'}</dd>
    </div>
  )
}

function BasicDetailsCard() {
  const { user } = useAuth()
  const name = user?.full_name?.trim() || [user?.first_name, user?.last_name].filter(Boolean).join(' ')

  return (
    <Card icon={User} title="Basic Details">
      <dl className="divide-y divide-slate-100">
        <FieldRow label="Name" value={name} />
        <FieldRow label="Email" value={user?.email} />
        <FieldRow label="Phone" value={user?.phone} />
      </dl>
    </Card>
  )
}

export default function ProfileSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <BasicDetailsCard />
    </div>
  )
}
