import { useState } from 'react'
import { Bell, User } from 'lucide-react'
import { useAuth } from '../common/auth/AuthContext'

// Local only for now: not saved, resets on reload
const communicationPreferenceTemplate = [
  { id: 1, label: 'Email Notifications', description: 'Loan updates, document requests, and messages', enabled: true },
  { id: 2, label: 'SMS Alerts', description: 'Time-sensitive deadlines and draw approvals', enabled: true },
  { id: 3, label: 'Draw Request Updates', description: 'Status changes on submitted draw requests', enabled: true },
  { id: 4, label: 'Marketing & Promotions', description: 'New products, rate changes, referral offers', enabled: false },
]

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

function CommunicationPreferencesCard() {
  const [prefs, setPrefs] = useState(communicationPreferenceTemplate)

  const toggle = (id) => {
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)))
  }

  return (
    <Card icon={Bell} title="Communication Preferences">
      <ul className="divide-y divide-slate-100">
        {prefs.map((pref) => (
          <li key={pref.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{pref.label}</p>
              <p className="text-xs text-slate-400">{pref.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pref.enabled}
              aria-label={pref.label}
              onClick={() => toggle(pref.id)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                pref.enabled ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  pref.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function ProfileSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <BasicDetailsCard />
      <CommunicationPreferencesCard />
    </div>
  )
}
