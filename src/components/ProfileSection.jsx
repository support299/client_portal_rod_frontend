import { useState } from 'react'
import {
  Building2,
  Users,
  ShieldCheck,
  MapPin,
  Bell,
  Eye,
  EyeOff,
  Pencil,
  CreditCard,
  BadgeCheck,
} from 'lucide-react'
import {
  businessInfo,
  llcInfo,
  taxId,
  bankAccounts,
  authorizedSigners,
  insuranceCertificates,
  mailingAddress,
  communicationPreferences,
} from '../data/dashboardData'

function Card({ icon: Icon, title, children, onEdit }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-emerald-700"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function FieldRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  )
}

function BusinessInfoCard() {
  return (
    <Card icon={Building2} title="Business Information" onEdit={() => {}}>
      <dl className="divide-y divide-slate-100">
        <FieldRow label="Business Name" value={businessInfo.name} />
        <FieldRow label="Entity Type" value={businessInfo.entityType} />
        <FieldRow label="Years in Business" value={businessInfo.yearsInBusiness} />
        <FieldRow label="Website" value={businessInfo.website} />
      </dl>
    </Card>
  )
}

function LlcInfoCard() {
  return (
    <Card icon={BadgeCheck} title="LLC Information" onEdit={() => {}}>
      <dl className="divide-y divide-slate-100">
        <FieldRow label="LLC Name" value={llcInfo.name} />
        <FieldRow label="State of Formation" value={llcInfo.stateOfFormation} />
        <FieldRow label="Formation Date" value={llcInfo.formationDate} />
        <FieldRow label="Registered Agent" value={llcInfo.registeredAgent} />
      </dl>
    </Card>
  )
}

function TaxIdCard() {
  const [revealed, setRevealed] = useState(false)
  const masked = `**-***${taxId.ein.slice(-4)}`

  return (
    <Card icon={ShieldCheck} title="Tax ID (EIN)">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-sm font-semibold text-slate-900">
          {revealed ? taxId.ein : masked}
        </p>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-emerald-700"
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      </div>
    </Card>
  )
}

function BankAccountsCard() {
  return (
    <Card icon={CreditCard} title="Bank Accounts">
      <ul className="divide-y divide-slate-100">
        {bankAccounts.map((account) => (
          <li key={account.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{account.bankName}</p>
              <p className="text-xs text-slate-400">
                {account.accountType} &middot; &bull;&bull;&bull;&bull; {account.last4}
              </p>
            </div>
            {account.primary && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Primary
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function AuthorizedSignersCard() {
  return (
    <Card icon={Users} title="Authorized Signers">
      <ul className="divide-y divide-slate-100">
        {authorizedSigners.map((signer) => (
          <li key={signer.id} className="py-3">
            <p className="text-sm font-semibold text-slate-900">
              {signer.name} <span className="font-normal text-slate-400">&middot; {signer.title}</span>
            </p>
            <p className="mt-0.5 text-sm text-slate-500">{signer.email}</p>
            <p className="text-sm text-slate-500">{signer.phone}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function InsuranceCertificatesCard() {
  return (
    <Card icon={ShieldCheck} title="Insurance Certificates">
      <ul className="divide-y divide-slate-100">
        {insuranceCertificates.map((cert) => (
          <li key={cert.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {cert.provider} <span className="font-normal text-slate-400">&middot; {cert.coverageType}</span>
              </p>
              <p className="text-xs text-slate-400">
                {cert.policyNumber} &middot; Expires {cert.expiration}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                cert.status === 'Active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {cert.status}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function MailingAddressCard() {
  return (
    <Card icon={MapPin} title="Mailing Address" onEdit={() => {}}>
      <p className="text-sm text-slate-700">
        {mailingAddress.line1}
        {mailingAddress.line2 && <>, {mailingAddress.line2}</>}
        <br />
        {mailingAddress.city}, {mailingAddress.state} {mailingAddress.zip}
      </p>
    </Card>
  )
}

function CommunicationPreferencesCard() {
  const [prefs, setPrefs] = useState(communicationPreferences)

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
      <BusinessInfoCard />
      <LlcInfoCard />
      <TaxIdCard />
      <BankAccountsCard />
      <AuthorizedSignersCard />
      <InsuranceCertificatesCard />
      <MailingAddressCard />
      <CommunicationPreferencesCard />
    </div>
  )
}
