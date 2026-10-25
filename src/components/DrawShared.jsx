import { useRef } from 'react'
import { Download, FileText, History, Upload } from 'lucide-react'
import { fetchDocumentFile, openBlob } from '../api/documents'
import { drawStatusStyles } from '../common/constants/uiStyles'
import { drawStatusLabel, money } from '../utils/draws'
import { errorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'

// Draw pieces shared by the borrower's Draw Requests page and the admin loan panel

export function DrawStatusBadge({ status }) {
  const [label, classes] = drawStatusStyles[status] ?? [status, 'bg-slate-100 text-slate-600']
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>{label}</span>
}

// Holdback with what's redeemed, in progress and left; summary is from fetchDrawSummary
export function DrawSummaryBar({ summary }) {
  const holdback = Number(summary?.holdback ?? 0)
  const redeemed = Number(summary?.redeemed ?? 0)
  const inProgress = Number(summary?.in_progress ?? 0)
  const pct = (n) => (holdback > 0 ? Math.min(100, (n / holdback) * 100) : 0)
  const tiles = [
    ['Holdback', money(summary?.holdback), 'text-slate-900'],
    ['Redeemed', money(redeemed), 'text-emerald-700'],
    ['In progress', money(inProgress), 'text-blue-700'],
    ['Still available', money(summary?.available), 'text-slate-900'],
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map(([label, value, color]) => (
          <div key={label}>
            <p className="text-xs text-slate-400">{label}</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div
        className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={`${Math.round(pct(redeemed))}% redeemed, ${Math.round(pct(inProgress))}% in progress`}
      >
        <div className="h-full bg-emerald-600" style={{ width: `${pct(redeemed)}%` }} />
        <div className="h-full bg-blue-400" style={{ width: `${pct(inProgress)}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-600" />Redeemed</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-400" />In progress</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-slate-200" />Available</span>
      </div>
    </div>
  )
}

// Hidden multi-file input behind a button; calls onFiles with the chosen Files
export function FilesButton({ label, busy, onFiles, className }) {
  const input = useRef(null)
  return (
    <>
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className={className}>
        <Upload className="h-3.5 w-3.5" />
        {busy ? 'Uploading…' : label}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length) onFiles(files)
        }}
      />
    </>
  )
}

export function DrawFiles({ files, onError }) {
  async function open(doc, filename) {
    try {
      openBlob(await fetchDocumentFile(doc.download_url), filename)
    } catch (err) {
      onError(errorMessage(err))
    }
  }

  if (!files?.length) return <p className="text-xs text-slate-400">No files yet.</p>
  return (
    <ul className="space-y-1">
      {files.map((doc) => (
        <li key={doc.id} className="flex items-center gap-2 text-xs text-slate-600">
          <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <button
            type="button"
            onClick={() => open(doc)}
            className="min-w-0 truncate text-left font-medium text-slate-800 hover:text-emerald-700 hover:underline"
          >
            {doc.name}
          </button>
          {doc.document_type_name && <span className="shrink-0 text-slate-400">{doc.document_type_name}</span>}
          <span className="shrink-0 text-slate-400">{formatDate(doc.uploaded_at)}</span>
          <button
            type="button"
            onClick={() => open(doc, doc.name)}
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Download ${doc.name}`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  )
}

// Every status change, oldest first, from DrawRequestStatusChange
export function DrawHistory({ changes }) {
  if (!changes?.length) return null
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
        <History className="h-3.5 w-3.5" />
        History ({changes.length})
      </summary>
      <ol className="mt-2 space-y-2 border-l border-slate-200 pl-4">
        {changes.map((c) => (
          <li key={c.id} className="text-xs">
            <p className="text-slate-700">
              <span className="font-semibold">
                {c.from_status ? `${drawStatusLabel(c.from_status)} → ` : ''}
                {drawStatusLabel(c.to_status)}
              </span>
              {c.amount_approved != null && ['approved', 'funded'].includes(c.to_status) && (
                <span className="text-slate-500"> · {money(c.amount_approved)}</span>
              )}
            </p>
            <p className="text-slate-400">
              {[c.changed_by?.full_name?.trim(), formatDate(c.changed_at, true)].filter(Boolean).join(' · ')}
            </p>
            {c.note && <p className="mt-0.5 whitespace-pre-line text-slate-600">{c.note}</p>}
          </li>
        ))}
      </ol>
    </details>
  )
}
