import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Download, Eye, EyeOff, FilePlus2, FileText, Trash2, Upload, X } from 'lucide-react'
import {
  createDocumentRequest,
  deleteDocumentRequest,
  deleteLoanDocument,
  fetchDocumentFile,
  fetchDocumentRequests,
  fetchDocumentTypes,
  fetchLoanDocuments,
  openBlob,
  updateDocumentRequest,
  updateLoanDocument,
  uploadLoanDocument,
} from '../../api/documents'
import { errorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none'
const smallButton =
  'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50'
const primaryButton =
  'inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60'

// Keyed by DocumentRequest.Status
const requestStatus = {
  requested: ['Requested', 'bg-slate-100 text-slate-600'],
  pending_review: ['Pending Review', 'bg-blue-100 text-blue-700'],
  needs_revision: ['Needs Revision', 'bg-amber-100 text-amber-800'],
  uploaded: ['Uploaded', 'bg-emerald-100 text-emerald-700'],
  rejected: ['Rejected', 'bg-red-100 text-red-700'],
}

// Keyed by LoanDocument.ReviewStatus
const reviewStatus = {
  unreviewed: ['Unreviewed', 'bg-slate-100 text-slate-600'],
  accepted: ['Accepted', 'bg-emerald-100 text-emerald-700'],
  rejected: ['Rejected', 'bg-red-100 text-red-700'],
}

function Badge({ styles, value }) {
  const [label, classes] = styles[value] ?? [value, 'bg-slate-100 text-slate-600']
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${classes}`}>{label}</span>
}

function fileSize(bytes) {
  if (bytes == null) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Hidden file input behind a button; calls onFile with the chosen File
function FilePicker({ label, disabled, onFile, className = smallButton }) {
  const input = useRef(null)
  return (
    <>
      <button type="button" disabled={disabled} onClick={() => input.current?.click()} className={className}>
        <Upload className="h-3.5 w-3.5" />
        {label}
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

async function openDocument(doc, onError) {
  try {
    openBlob(await fetchDocumentFile(doc.download_url))
  } catch (err) {
    onError(errorMessage(err))
  }
}

async function saveDocument(doc, onError) {
  try {
    openBlob(await fetchDocumentFile(doc.download_url), doc.name)
  } catch (err) {
    onError(errorMessage(err))
  }
}

function DocumentRow({ loanId, doc, onChanged, onError }) {
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')

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

  const review = (review_status, reviewer_note) =>
    run(() => updateLoanDocument(loanId, doc.id, { review_status, ...(reviewer_note != null && { reviewer_note }) }))

  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => openDocument(doc, onError)}
            className="block max-w-full truncate text-left text-sm font-semibold text-slate-900 hover:text-emerald-700"
            title="Open"
          >
            {doc.name}
          </button>
          <p className="text-xs text-slate-400">
            {[
              doc.direction === 'lender_share' ? 'Shared by staff' : 'From borrower',
              doc.uploaded_by?.full_name?.trim(),
              formatDate(doc.uploaded_at, true),
              fileSize(doc.size),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {!doc.visible_to_borrower && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-white">
              <EyeOff className="h-3 w-3" />
              Internal
            </span>
          )}
          {doc.direction === 'borrower_upload' && <Badge styles={reviewStatus} value={doc.review_status} />}
          <button type="button" onClick={() => saveDocument(doc, onError)} className={smallButton} aria-label="Download">
            <Download className="h-3.5 w-3.5" />
          </button>
          {doc.direction === 'borrower_upload' && doc.review_status !== 'accepted' && (
            <button type="button" disabled={busy} onClick={() => review('accepted')} className={smallButton}>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Accept
            </button>
          )}
          {doc.direction === 'borrower_upload' && doc.review_status !== 'rejected' && (
            <button type="button" disabled={busy} onClick={() => setRejecting((r) => !r)} className={smallButton}>
              <X className="h-3.5 w-3.5 text-red-600" />
              Reject
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() => updateLoanDocument(loanId, doc.id, { visible_to_borrower: !doc.visible_to_borrower }))
            }
            className={smallButton}
            title={doc.visible_to_borrower ? 'Hide from borrower' : 'Show to borrower'}
            aria-label={doc.visible_to_borrower ? 'Hide from borrower' : 'Show to borrower'}
          >
            {doc.visible_to_borrower ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => window.confirm(`Remove ${doc.name}? It stays in GHL media.`) && run(() => deleteLoanDocument(loanId, doc.id))}
            className={smallButton}
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {rejecting && (
        <form
          className="mt-2 flex flex-wrap items-start gap-2 pl-11"
          onSubmit={(e) => {
            e.preventDefault()
            review('rejected', note.trim()).then(() => setRejecting(false))
          }}
        >
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What needs fixing? (shown to the borrower)"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none"
          />
          <button type="submit" disabled={busy} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            Reject file
          </button>
        </form>
      )}
    </li>
  )
}

function RequestCard({ loanId, request, onChanged, onError }) {
  const [busy, setBusy] = useState(false)

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

  const overdue =
    request.due_date && !['uploaded'].includes(request.status) && new Date(`${request.due_date}T23:59:59`) < new Date()

  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900">{request.name}</h4>
            <Badge styles={requestStatus} value={request.status} />
            {request.kind === 'fill_form' && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">Form</span>
            )}
            {request.source === 'checklist' && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Checklist</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {[
              `Requested ${formatDate(request.requested_at)}`,
              request.requested_by?.full_name?.trim() && `by ${request.requested_by.full_name.trim()}`,
            ]
              .filter(Boolean)
              .join(' ')}
            {request.due_date && (
              <span className={overdue ? 'font-semibold text-red-600' : undefined}>
                {' '}&middot; Due {formatDate(request.due_date)}
                {overdue && ' (overdue)'}
              </span>
            )}
          </p>
          {request.description && <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">{request.description}</p>}
          {request.reviewer_note && ['needs_revision', 'rejected'].includes(request.status) && (
            <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">Note: {request.reviewer_note}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FilePicker
            label="Upload for borrower"
            disabled={busy}
            onFile={(file) => run(() => uploadLoanDocument(loanId, { file, request: request.id }))}
          />
          {request.status !== 'uploaded' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => updateDocumentRequest(loanId, request.id, { status: 'uploaded' }))}
              className={smallButton}
              title="Mark as received without reviewing a file"
            >
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Complete
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              window.confirm(`Remove the request for ${request.name}? Its files stay on the loan.`) &&
              run(() => deleteDocumentRequest(loanId, request.id))
            }
            className={smallButton}
            aria-label="Remove request"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {request.form_document && (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-800">
          Blank form shared:
          <button
            type="button"
            onClick={() => openDocument(request.form_document, onError)}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {request.form_document.name}
          </button>
        </p>
      )}

      {request.documents.length > 0 ? (
        <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
          {request.documents.map((doc) => (
            <DocumentRow key={doc.id} loanId={loanId} doc={doc} onChanged={onChanged} onError={onError} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-400">No files yet.</p>
      )}
    </li>
  )
}

function RequestForm({ loanId, types, onCancel, onCreated }) {
  const [form, setForm] = useState({ document_type: '', name: '', description: '', kind: 'upload', due_date: '' })
  const [formFile, setFormFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const selectedType = types.find((t) => String(t.id) === form.document_type)

  function chooseType(id) {
    const type = types.find((t) => String(t.id) === id)
    setForm((f) => ({
      ...f,
      document_type: id,
      name: type?.name ?? '',
      description: type?.description ?? '',
      kind: type?.kind ?? 'upload',
    }))
    setFormFile(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createDocumentRequest(loanId, {
        document_type: form.document_type ? Number(form.document_type) : null,
        name: form.name.trim(),
        description: form.description.trim(),
        kind: form.kind,
        due_date: form.due_date || null,
        form_file: form.kind === 'fill_form' ? formFile : null,
      })
      onCreated()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // Types grouped by category for the picker
  const categories = [...new Set(types.map((t) => t.category || 'Other'))]

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <h4 className="text-sm font-semibold text-slate-900">Request a document</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="req-type" className="text-xs font-medium text-slate-500">Document type</label>
          <select id="req-type" value={form.document_type} onChange={(e) => chooseType(e.target.value)} className={inputClass}>
            <option value="">Custom (no type)</option>
            {categories.map((category) => (
              <optgroup key={category} label={category}>
                {types
                  .filter((t) => (t.category || 'Other') === category)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="req-name" className="text-xs font-medium text-slate-500">Name</label>
          <input
            id="req-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required={!form.document_type}
            placeholder="e.g. Bank Statements (last 2 months)"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="req-kind" className="text-xs font-medium text-slate-500">Borrower should</label>
          <select
            id="req-kind"
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
            className={inputClass}
          >
            <option value="upload">Upload their own file</option>
            <option value="fill_form">Fill in a form we share</option>
          </select>
        </div>
        <div>
          <label htmlFor="req-due" className="text-xs font-medium text-slate-500">Due date (optional)</label>
          <input
            id="req-due"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="req-desc" className="text-xs font-medium text-slate-500">Instructions for the borrower</label>
        <textarea
          id="req-desc"
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className={inputClass}
        />
      </div>
      {form.kind === 'fill_form' && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <FilePicker label={formFile ? 'Change form' : 'Attach blank form'} onFile={setFormFile} />
          {formFile ? (
            <span className="font-medium text-slate-800">{formFile.name}</span>
          ) : selectedType?.has_template ? (
            <span>Leave empty to share the type&apos;s form ({selectedType.template_name}).</span>
          ) : (
            <span className="text-amber-700">This type has no blank form; attach one for the borrower.</span>
          )}
        </div>
      )}
      <p className="text-xs text-slate-400">The request is also posted in the loan chat.</p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryButton}>
          {saving ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </form>
  )
}

function ShareForm({ loanId, requests, onCancel, onUploaded }) {
  const [file, setFile] = useState(null)
  const [requestId, setRequestId] = useState('')
  const [visible, setVisible] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return setError('Choose a file first.')
    setSaving(true)
    setError('')
    try {
      await uploadLoanDocument(loanId, {
        file,
        request: requestId ? Number(requestId) : null,
        visible_to_borrower: visible,
      })
      onUploaded()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
      <h4 className="text-sm font-semibold text-slate-900">Upload a file</h4>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <FilePicker label={file ? 'Change file' : 'Choose file'} onFile={setFile} />
        <span className="text-slate-700">{file ? `${file.name} (${fileSize(file.size)})` : 'Max 25 MB'}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="share-request" className="text-xs font-medium text-slate-500">For request</label>
          <select id="share-request" value={requestId} onChange={(e) => setRequestId(e.target.value)} className={inputClass}>
            <option value="">None: share with the borrower / keep on file</option>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>{r.name} (on the borrower&apos;s behalf)</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Visible to the borrower
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button type="submit" disabled={saving || !file} className={primaryButton}>
          {saving ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </form>
  )
}

// The Documents tab of the loan panel: requests with their files, then other files
export default function LoanDocuments({ loanId }) {
  const [requests, setRequests] = useState([])
  const [otherFiles, setOtherFiles] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(null) // 'request' | 'file' | null

  const load = useCallback(async () => {
    try {
      const [reqs, files] = await Promise.all([fetchDocumentRequests(loanId), fetchLoanDocuments(loanId)])
      setRequests(reqs ?? [])
      // Files sent against a request show under it
      setOtherFiles((files ?? []).filter((f) => !f.request))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [loanId])

  useEffect(() => {
    load()
    fetchDocumentTypes()
      .then((data) => setTypes(data ?? []))
      .catch(() => setTypes([]))
  }, [load])

  const open = requests.filter((r) => r.status !== 'uploaded').length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {requests.length} request{requests.length === 1 ? '' : 's'}
          {requests.length > 0 && <> &middot; {open} outstanding</>}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAdding('request')} className={primaryButton}>
            <FilePlus2 className="h-4 w-4" />
            Request document
          </button>
          <button
            type="button"
            onClick={() => setAdding('file')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            Upload file
          </button>
        </div>
      </div>

      {error && (
        <p className="flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => setError('')} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </p>
      )}

      {adding === 'request' && (
        <RequestForm
          loanId={loanId}
          types={types}
          onCancel={() => setAdding(null)}
          onCreated={() => {
            setAdding(null)
            load()
          }}
        />
      )}
      {adding === 'file' && (
        <ShareForm
          loanId={loanId}
          requests={requests}
          onCancel={() => setAdding(null)}
          onUploaded={() => {
            setAdding(null)
            load()
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading documents…</p>
      ) : (
        <>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Requested from borrower</h3>
            {requests.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No documents requested yet.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {requests.map((r) => (
                  <RequestCard key={r.id} loanId={loanId} request={r} onChanged={load} onError={setError} />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Other files</h3>
            {otherFiles.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No other files.</p>
            ) : (
              <ul className="mt-1 divide-y divide-slate-100">
                {otherFiles.map((doc) => (
                  <DocumentRow key={doc.id} loanId={loanId} doc={doc} onChanged={load} onError={setError} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
