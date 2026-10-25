import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleCheck, CircleX, Clock, Download, FileText, PencilLine, Trash2, Upload } from 'lucide-react'
import {
  deleteLoanDocument,
  fetchDocumentFile,
  fetchDocumentRequests,
  fetchLoanDocuments,
  openBlob,
  uploadLoanDocument,
} from '../api/documents'
import { errorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'

// Keyed by DocumentRequest.Status: [label, badge classes, icon]
const requestStatus = {
  requested: ['Needed', 'bg-amber-100 text-amber-800', Clock],
  needs_revision: ['Needs Revision', 'bg-amber-100 text-amber-800', PencilLine],
  rejected: ['Rejected', 'bg-red-100 text-red-700', CircleX],
  pending_review: ['In Review', 'bg-blue-100 text-blue-700', Clock],
  uploaded: ['Received', 'bg-emerald-100 text-emerald-700', CircleCheck],
}

// What the borrower has to act on comes first
const statusOrder = ['needs_revision', 'rejected', 'requested', 'pending_review', 'uploaded']

const reviewLabels = {
  unreviewed: ['In review', 'text-blue-600'],
  accepted: ['Accepted', 'text-emerald-600'],
  rejected: ['Not accepted', 'text-red-600'],
}

const outlineButton =
  'flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60'

function fileSize(bytes) {
  if (bytes == null) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function UploadButton({ label = 'Upload', busy, onFile, className = outlineButton }) {
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
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onFile(file)
        }}
      />
    </>
  )
}

function FileLink({ doc, onError, children }) {
  async function open() {
    try {
      openBlob(await fetchDocumentFile(doc.download_url))
    } catch (err) {
      onError(errorMessage(err))
    }
  }
  return (
    <button type="button" onClick={open} className="truncate text-left hover:text-emerald-700 hover:underline">
      {children ?? doc.name}
    </button>
  )
}

function DownloadButton({ doc, onError }) {
  async function save() {
    try {
      openBlob(await fetchDocumentFile(doc.download_url), doc.name)
    } catch (err) {
      onError(errorMessage(err))
    }
  }
  return (
    <button
      type="button"
      onClick={save}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      aria-label={`Download ${doc.name}`}
    >
      <Download className="h-4 w-4" />
    </button>
  )
}

function RequestItem({ loanId, request, userId, onChanged, onError }) {
  const [busy, setBusy] = useState(false)
  const [label, classes, Icon] = requestStatus[request.status] ?? requestStatus.requested
  const needsAction = ['requested', 'needs_revision', 'rejected'].includes(request.status)
  const overdue = needsAction && request.due_date && new Date(`${request.due_date}T23:59:59`) < new Date()

  async function run(action) {
    setBusy(true)
    try {
      await action()
      await onChanged()
    } catch (err) {
      onError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${classes}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{request.name}</p>
            {request.due_date && (
              <p className={`text-xs ${overdue ? 'font-semibold text-red-600' : 'text-slate-400'}`}>
                Due {formatDate(request.due_date)}
                {overdue && ' (overdue)'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>{label}</span>
          {request.status !== 'uploaded' && (
            <UploadButton
              label={request.documents.length ? 'Add file' : 'Upload'}
              busy={busy}
              onFile={(file) => run(() => uploadLoanDocument(loanId, { file, request: request.id }))}
            />
          )}
        </div>
      </div>

      <div className="space-y-2 pl-11">
        {request.description && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{request.description}</p>}

        {request.reviewer_note && ['needs_revision', 'rejected'].includes(request.status) && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span className="font-semibold">From your loan team:</span> {request.reviewer_note}
          </p>
        )}

        {request.form_document && request.status !== 'uploaded' && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-800">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>
              Download and fill in{' '}
              <span className="font-semibold">
                <FileLink doc={request.form_document} onError={onError} />
              </span>
              , then upload it here.
            </span>
          </div>
        )}

        {request.documents.length > 0 && (
          <ul className="space-y-1">
            {request.documents.map((doc) => {
              const [reviewLabel, reviewClass] = reviewLabels[doc.review_status] ?? reviewLabels.unreviewed
              const canRemove = doc.uploaded_by?.id === userId && doc.review_status === 'unreviewed'
              return (
                <li key={doc.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="min-w-0 truncate font-medium text-slate-800">
                    <FileLink doc={doc} onError={onError} />
                  </span>
                  <span className="shrink-0 text-slate-400">{formatDate(doc.uploaded_at)}</span>
                  <span className={`shrink-0 font-semibold ${reviewClass}`}>{reviewLabel}</span>
                  {canRemove && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        window.confirm(`Remove ${doc.name}?`) && run(() => deleteLoanDocument(loanId, doc.id))
                      }
                      className="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-red-600"
                      aria-label={`Remove ${doc.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </li>
  )
}

function DocumentsNeededCard({ loanId, requests, userId, loading, onChanged, onError }) {
  const outstanding = requests.filter((r) => ['requested', 'needs_revision', 'rejected'].includes(r.status)).length
  const sorted = [...requests].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Documents Needed</h2>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'Loading…'
              : outstanding
                ? `${outstanding} document${outstanding === 1 ? '' : 's'} waiting on you.`
                : 'You’re all caught up.'}
          </p>
        </div>
      </div>

      {!loading && requests.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No document requests at this time.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {sorted.map((request) => (
            <RequestItem
              key={request.id}
              loanId={loanId}
              request={request}
              userId={userId}
              onChanged={onChanged}
              onError={onError}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function FileList({ files, emptyText, onError }) {
  if (files.length === 0) return <p className="mt-4 text-sm text-slate-500">{emptyText}</p>
  return (
    <ul className="mt-4 divide-y divide-slate-100">
      {files.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                <FileLink doc={doc} onError={onError} />
              </p>
              <p className="text-xs text-slate-400">
                {[formatDate(doc.uploaded_at), fileSize(doc.size)].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <DownloadButton doc={doc} onError={onError} />
        </li>
      ))}
    </ul>
  )
}

const awaitingStatuses = ['requested', 'needs_revision', 'rejected']

// One tab per loan, with how many documents each is waiting on
function LoanTabs({ loans, selectedId, onChange, refreshKey }) {
  const [waiting, setWaiting] = useState({})

  useEffect(() => {
    let cancelled = false
    Promise.all(
      loans.map((loan) =>
        fetchDocumentRequests(loan.id)
          .then((reqs) => [loan.id, (reqs ?? []).filter((r) => awaitingStatuses.includes(r.status)).length])
          .catch(() => [loan.id, null]),
      ),
    ).then((counts) => !cancelled && setWaiting(Object.fromEntries(counts)))
    return () => {
      cancelled = true
    }
  }, [loans, refreshKey])

  return (
    <div role="tablist" aria-label="Loans" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {loans.map((loan) => {
        const active = loan.id === selectedId
        const count = waiting[loan.id]
        return (
          <button
            key={loan.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(loan)}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-left transition-colors ${
              active
                ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="min-w-0">
              <span className={`block max-w-[16rem] truncate text-sm font-semibold ${active ? 'text-emerald-800' : 'text-slate-900'}`}>
                {loan.loanName || loan.address}
              </span>
              {loan.status && <span className="block text-xs text-slate-400">{loan.status}</span>}
            </span>
            {count > 0 && (
              <span
                className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800"
                title={`${count} document${count === 1 ? '' : 's'} waiting on you`}
              >
                {count}
              </span>
            )}
            {count === 0 && <CircleCheck className="h-4 w-4 text-emerald-500" aria-label="All caught up" />}
          </button>
        )
      })}
    </div>
  )
}

export default function DocumentCenterSection({ loans = [], selectedLoan = null, onChangeLoan, userId }) {
  const loanId = selectedLoan?.id
  const [requests, setRequests] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!loanId) return
    try {
      const [reqs, docs] = await Promise.all([fetchDocumentRequests(loanId), fetchLoanDocuments(loanId)])
      setRequests(reqs ?? [])
      setFiles(docs ?? [])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [loanId])

  useEffect(() => {
    setLoading(true)
    setError('')
    setRequests([])
    setFiles([])
    load()
  }, [load])

  async function uploadOther(file) {
    setUploading(true)
    try {
      await uploadLoanDocument(loanId, { file })
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  if (!selectedLoan) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 sm:p-6">
        Documents will appear here once you have a loan.
      </div>
    )
  }

  // Blank forms already show under their request
  const formIds = new Set(requests.map((r) => r.form_document?.id).filter(Boolean))
  const sent = files.filter((f) => f.direction === 'lender_share' && !f.request && !formIds.has(f.id))
  const otherUploads = files.filter((f) => f.direction === 'borrower_upload' && !f.request)

  return (
    <div className="space-y-6">
      {loans.length > 1 && (
        <LoanTabs loans={loans} selectedId={loanId} onChange={onChangeLoan} refreshKey={requests} />
      )}
      <h2 className="text-lg font-semibold text-slate-900">
        {selectedLoan.loanName || selectedLoan.address}
        {selectedLoan.status && <span className="ml-2 text-sm font-normal text-slate-400">{selectedLoan.status}</span>}
      </h2>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          <button type="button" onClick={() => setError('')} className="font-semibold underline">
            Dismiss
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DocumentsNeededCard
          loanId={loanId}
          requests={requests}
          userId={userId}
          loading={loading}
          onChanged={load}
          onError={setError}
        />

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Documents We Sent</h2>
            <p className="mt-1 text-sm text-slate-500">Download everything anytime.</p>
            {!loading && <FileList files={sent} emptyText="No documents shared yet." onError={setError} />}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Other Files You Sent</h2>
                <p className="mt-1 text-sm text-slate-500">Anything else your loan team should have.</p>
              </div>
              <UploadButton label="Upload a file" busy={uploading} onFile={uploadOther} />
            </div>
            {!loading && <FileList files={otherUploads} emptyText="Nothing uploaded yet." onError={setError} />}
          </div>
        </div>
      </div>
    </div>
  )
}
