import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { fetchAllLoans, updateLoanStatus } from '../../api/admin'
import { dealHealthConfig } from '../../common/constants/uiStyles'

// Keys match portal Loan.Status on the backend
export const pipelineStages = [
  { key: 'application', label: 'Application' },
  { key: 'processing', label: 'Processing' },
  { key: 'underwriting', label: 'Underwriting' },
  { key: 'approval', label: 'Approval' },
  { key: 'closing', label: 'Closing' },
  { key: 'funded', label: 'Funded' },
]

function LoanCard({ loan, stages, saving, onChangeStatus }) {
  const healthClasses = dealHealthConfig[loan.health]?.classes ?? 'bg-slate-100 text-slate-600'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{loan.address}</p>
        {loan.health && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${healthClasses}`}>
            {loan.health}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">{loan.borrowerName || loan.entityName || '—'}</p>
      {loan.borrowerEmail && <p className="text-xs text-slate-400">{loan.borrowerEmail}</p>}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
        <span className="font-semibold text-slate-700">{loan.loanAmount}</span>
        <span className="text-slate-400">{loan.loanType}</span>
      </div>
      {loan.stageName && <p className="mt-1.5 text-xs text-slate-400">Stage: {loan.stageName}</p>}

      <label className="mt-3 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
        Status
        <select
          value={loan.statusKey}
          disabled={saving}
          onChange={(e) => onChangeStatus(loan, e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal normal-case tracking-normal text-slate-700 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default function PipelineSection() {
  const [loans, setLoans] = useState([])
  const [stages, setStages] = useState(pipelineStages)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAllLoans()
      setLoans(data.loans || [])
      if (data.stages?.length) setStages(data.stages)
    } catch (err) {
      setError(err.message || 'Failed to load loans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleChangeStatus = async (loan, statusKey) => {
    setSavingId(loan.id)
    setError('')
    try {
      const updated = await updateLoanStatus(loan.id, statusKey)
      setLoans((list) => list.map((l) => (l.id === loan.id ? { ...l, ...updated } : l)))
    } catch (err) {
      setError(err.message || 'Failed to update status')
    } finally {
      setSavingId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return loans
    return loans.filter((l) =>
      [l.address, l.borrowerName, l.borrowerEmail, l.entityName, l.id]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q)),
    )
  }, [loans, query])

  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">Loading loans…</p>
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, borrower, email…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <p className="text-sm text-slate-500">{loans.length} loans</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {stages.map((stage) => {
            const stageLoans = filtered.filter((l) => l.statusKey === stage.key)
            return (
              <div key={stage.key} className="w-72 shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-slate-700">{stage.label}</h2>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-600">
                    {stageLoans.length}
                  </span>
                </div>
                <div className="space-y-3 rounded-xl bg-slate-100/70 p-2.5">
                  {stageLoans.length === 0 ? (
                    <p className="px-1.5 py-3 text-center text-xs text-slate-400">No loans</p>
                  ) : (
                    stageLoans.map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        stages={stages}
                        saving={savingId === loan.id}
                        onChangeStatus={handleChangeStatus}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
