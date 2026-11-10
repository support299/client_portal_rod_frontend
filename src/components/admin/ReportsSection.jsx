import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import {
  exportLoanReport, fetchLoanReport, fetchLoanStages, fetchOpportunityFilters, fetchUsers,
} from '../../api/admin'
import { openBlob } from '../../api/documents'
import { errorMessage } from '../../utils/errors'
import { money } from '../../utils/draws'

const statuses = [
  { value: 'open', label: 'Open' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'abandoned', label: 'Abandoned' },
]

const inputClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none'

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

// One breakdown (by stage, status, ...) as a name / loans / volume table
function BreakdownTable({ title, nameHeader, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h3 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">No loans match these filters.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-2 font-medium">{nameHeader}</th>
              <th className="px-4 py-2 text-right font-medium">Loans</th>
              <th className="px-4 py-2 text-right font-medium">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-2 text-slate-700">{row.name}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-900">{row.count}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-900">{money(row.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function ReportsSection() {
  const [filters, setFilters] = useState({ start: '', end: '', officer: '', source: '', status: '', stage: '' })
  const [stages, setStages] = useState([])
  const [sources, setSources] = useState([])
  const [officers, setOfficers] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  // Only send the filters that are set
  const params = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
    [filters],
  )

  useEffect(() => {
    fetchLoanStages()
      .then((data) => setStages(Array.isArray(data) ? data : []))
      .catch(() => setStages([]))
    fetchOpportunityFilters()
      .then((data) => setSources(data?.sources ?? []))
      .catch(() => setSources([]))
    fetchUsers({ staff: 'true', is_active: 'true', page_size: 100 })
      .then((data) => setOfficers(data?.results ?? []))
      .catch(() => setOfficers([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetchLoanReport(params))
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    load()
  }, [load])

  function handleChange(e) {
    const { name, value } = e.target
    setFilters((f) => ({ ...f, [name]: value }))
  }

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await exportLoanReport(params)
      openBlob(blob, `loans-report-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  const lostAbandoned = (data?.by_status ?? [])
    .filter((row) => row.status === 'lost' || row.status === 'abandoned')
    .reduce((sum, row) => sum + row.count, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="report-start" className="block text-xs font-medium text-slate-500">From</label>
            <input id="report-start" name="start" type="date" value={filters.start} onChange={handleChange} className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label htmlFor="report-end" className="block text-xs font-medium text-slate-500">To</label>
            <input id="report-end" name="end" type="date" value={filters.end} onChange={handleChange} className={`mt-1 ${inputClass}`} />
          </div>
          <select name="stage" value={filters.stage} onChange={handleChange} aria-label="Stage" className={inputClass}>
            <option value="">All stages</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select name="status" value={filters.status} onChange={handleChange} aria-label="Status" className={inputClass}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select name="source" value={filters.source} onChange={handleChange} aria-label="Lead source" className={inputClass}>
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select name="officer" value={filters.officer} onChange={handleChange} aria-label="Loan officer" className={inputClass}>
            <option value="">All officers</option>
            {officers.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name?.trim() || u.email}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || loading}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={load}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          <button type="button" onClick={() => setError('')} className="font-semibold underline">
            Dismiss
          </button>
        </p>
      )}

      {!data ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading report…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Loans" value={data.total.count} />
            <StatTile label="Loan volume" value={money(data.total.volume)} />
            <StatTile
              label="Draw money released"
              value={money(data.draws.funded_volume)}
              hint={`${data.draws.funded_count} funded draws, ${data.draws.open_count} in progress`}
            />
            <StatTile label="Lost / abandoned" value={lostAbandoned} />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <BreakdownTable
              title="By stage"
              nameHeader="Stage"
              rows={data.by_stage.map((r) => ({ name: r.stage, count: r.count, volume: r.volume }))}
            />
            <BreakdownTable
              title="By status"
              nameHeader="Status"
              rows={data.by_status.map((r) => ({
                name: statuses.find((s) => s.value === r.status)?.label ?? r.status,
                count: r.count,
                volume: r.volume,
              }))}
            />
            <BreakdownTable
              title="By lead source"
              nameHeader="Source"
              rows={data.by_source.map((r) => ({ name: r.source, count: r.count, volume: r.volume }))}
            />
            <BreakdownTable
              title="By loan officer"
              nameHeader="Officer"
              rows={data.by_officer.map((r) => ({ name: r.officer, count: r.count, volume: r.volume }))}
            />
          </div>
        </>
      )}
    </div>
  )
}
