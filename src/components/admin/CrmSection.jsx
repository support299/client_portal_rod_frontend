import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Search, X } from 'lucide-react'
import { fetchOutboundLog, fetchOutboundLogs, fetchWebhookLog, fetchWebhookLogs } from '../../api/admin'
import { useAuth } from '../../common/auth/AuthContext'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 25

const badgeStyles = {
  processed: 'bg-emerald-100 text-emerald-700',
  success: 'bg-emerald-100 text-emerald-700',
  received: 'bg-blue-100 text-blue-700',
  ignored: 'bg-slate-100 text-slate-600',
  failed: 'bg-red-100 text-red-700',
}

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none'

// Each tab describes its endpoints and table columns, so the list and detail views are shared
const tabs = {
  webhooks: {
    label: 'Webhook deliveries',
    fetchList: fetchWebhookLogs,
    fetchOne: fetchWebhookLog,
    time: 'received_at',
    statusParam: 'status',
    statusOptions: [
      { value: 'received', label: 'Received' },
      { value: 'processed', label: 'Processed' },
      { value: 'failed', label: 'Failed' },
      { value: 'ignored', label: 'Ignored' },
    ],
    searchPlaceholder: 'Search object, contact, webhook or location ID',
    columns: [
      { label: 'Received', render: (r) => formatDate(r.received_at, true) },
      { label: 'Event', render: (r) => r.event_type },
      { label: 'Object', render: (r) => r.object_id || '—', mono: true },
      { label: 'Signature', render: (r) => (r.signature_valid ? 'Valid' : 'Invalid') },
    ],
    badge: (r) => r.status,
    bodies: [['Payload', 'payload']],
    summary: (r) => [
      ['Event', r.event_type],
      ['Status', r.status],
      ['Signature', r.signature_valid ? 'Valid' : 'Invalid'],
      ['Received', formatDate(r.received_at, true)],
      ['Processed', formatDate(r.processed_at, true)],
      ['Object ID', r.object_id],
      ['Contact ID', r.contact_id],
      ['Location ID', r.location_id],
      ['Webhook ID', r.webhook_id],
    ],
  },
  outbound: {
    label: 'Calls to GHL',
    fetchList: fetchOutboundLogs,
    fetchOne: fetchOutboundLog,
    time: 'created_at',
    statusParam: 'success',
    statusOptions: [
      { value: 'true', label: 'Succeeded' },
      { value: 'false', label: 'Failed' },
    ],
    searchPlaceholder: 'Search object ID, endpoint or error',
    columns: [
      { label: 'When', render: (r) => formatDate(r.created_at, true) },
      { label: 'Action', render: (r) => r.action },
      { label: 'Request', render: (r) => `${r.method} ${r.endpoint}`, mono: true },
      { label: 'By', render: (r) => r.triggered_by_email || '—' },
      { label: 'HTTP', render: (r) => r.http_status ?? '—' },
      { label: 'Time', render: (r) => (r.duration_ms != null ? `${r.duration_ms} ms` : '—') },
    ],
    badge: (r) => (r.success ? 'success' : 'failed'),
    badgeLabel: (r) => (r.success ? 'Success' : 'Failed'),
    bodies: [
      ['Request body', 'request_body'],
      ['Response body', 'response_body'],
    ],
    summary: (r) => [
      ['Action', r.action],
      ['Result', r.success ? 'Success' : 'Failed'],
      ['Request', `${r.method} ${r.endpoint}`],
      ['HTTP status', r.http_status],
      ['Duration', r.duration_ms != null ? `${r.duration_ms} ms` : null],
      ['Triggered by', r.triggered_by_email],
      ['Object ID', r.object_id],
      ['Location ID', r.location_id],
      ['When', formatDate(r.created_at, true)],
    ],
  },
}

function errorText(err) {
  if (err?.status === 403) return 'Only admins can view CRM activity.'
  return err?.message || 'Failed to load'
}

function StatusBadge({ tab, record }) {
  const key = tab.badge(record)
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${badgeStyles[key] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {tab.badgeLabel ? tab.badgeLabel(record) : key}
    </span>
  )
}

function LogDetail({ tab, id, onClose }) {
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    tab.fetchOne(id)
      .then((data) => !cancelled && setRecord(data))
      .catch((err) => !cancelled && setError(errorText(err)))
    return () => {
      cancelled = true
    }
  }, [tab, id])

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${tab.label} detail`}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              {record ? (record.event_type || record.action) : 'Loading…'}
            </h2>
            {record && (
              <div className="mt-2">
                <StatusBadge tab={tab} record={record} />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {record && (
            <>
              {record.error && (
                <p className="whitespace-pre-wrap rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{record.error}</p>
              )}
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
                {tab.summary(record)
                  .filter(([, value]) => value != null && value !== '')
                  .map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="break-all font-medium text-slate-900">{String(value)}</dd>
                    </div>
                  ))}
              </dl>
              {tab.bodies.map(([label, key]) => (
                <div key={key}>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</h3>
                  {record[key] == null ? (
                    <p className="text-sm text-slate-400">None recorded.</p>
                  ) : (
                    <pre className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
                      {JSON.stringify(record[key], null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CrmSection() {
  const { user } = useAuth()
  const [tabKey, setTabKey] = useState('webhooks')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const closeDetail = useCallback(() => setSelectedId(null), [])

  const tab = tabs[tabKey]
  const isAdmin = user?.role === 'admin'
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  function switchTab(key) {
    setTabKey(key)
    setFilter('')
    setQuery('')
    setSearch('')
    setPage(1)
  }

  // Debounce the search box; a new search starts from the first page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    setLoading(true)
    setError('')
    tab.fetchList({ search, [tab.statusParam]: filter, page, page_size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        setRows(data?.results ?? [])
        setCount(data?.count ?? 0)
      })
      .catch((err) => !cancelled && setError(errorText(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [tab, search, filter, page, reload, isAdmin])

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="text-sm text-slate-500">Only admins can view CRM activity.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">CRM Activity</h2>
          <p className="mt-1 text-sm text-slate-500">Events GHL sends us and the calls we make back to it.</p>
        </div>
        <button
          type="button"
          onClick={() => setReload((n) => n + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {Object.entries(tabs).map(([key, t]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
              key === tabKey
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab.searchPlaceholder}
            aria-label="Search"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by status"
          className={selectClass}
        >
          <option value="">All statuses</option>
          {tab.statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading && rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      ) : rows.length === 0 && !error ? (
        <p className="mt-4 text-sm text-slate-500">
          {search || filter ? 'Nothing matches these filters.' : 'Nothing recorded yet.'}
        </p>
      ) : (
        <div className={`-mx-5 mt-4 overflow-x-auto sm:-mx-6 ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
                {tab.columns.map((c, i) => (
                  <th key={c.label} className={`px-3 py-2.5 font-medium ${i === 0 ? 'pl-5 sm:pl-6' : ''}`}>{c.label}</th>
                ))}
                <th className="px-3 py-2.5 pr-5 font-medium sm:pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedId(row.id)}
                  className="cursor-pointer align-top hover:bg-slate-50"
                >
                  {tab.columns.map((c, i) => (
                    <td
                      key={c.label}
                      className={`px-3 py-3 text-slate-700 ${i === 0 ? 'whitespace-nowrap pl-5 sm:pl-6' : ''} ${c.mono ? 'break-all font-mono text-xs' : ''}`}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                  <td className="px-3 py-3 pr-5 sm:pr-6">
                    <StatusBadge tab={tab} record={row} />
                    {row.error && <p className="mt-1 max-w-[16rem] truncate text-xs text-red-600">{row.error}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {count > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>
            {count} record{count === 1 ? '' : 's'} &middot; Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount || loading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedId != null && <LogDetail key={`${tabKey}-${selectedId}`} tab={tab} id={selectedId} onClose={closeDetail} />}
    </div>
  )
}
