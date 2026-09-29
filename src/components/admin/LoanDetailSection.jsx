import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, AlertTriangle, Paperclip, Share2, HardHat } from 'lucide-react'
import { pipelineStages } from './PipelineSection'
import { dealHealthConfig, drawRequestStages } from '../../common/constants/uiStyles'

const pipelineLoans = []
const recentUploads = []
const missingDocuments = []
const drawRequestsByLoanNumber = {}

const healthOptions = Object.keys(dealHealthConfig)

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const drawStageBadgeStyles = [
  'bg-slate-100 text-slate-600',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-700',
]

function DrawRequestCard({ request, onAdvance, isFirst }) {
  return (
    <li className={isFirst ? '' : 'pt-5'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {request.label} &middot; {request.amount}
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${drawStageBadgeStyles[request.stage]}`}>
          {drawRequestStages[request.stage]}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{request.comment}</p>
      <p className="mt-1 text-xs text-slate-400">Requested {request.requestedDate}</p>

      {request.documents?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {request.documents.map((doc) => (
            <span
              key={doc}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
            >
              <Paperclip className="h-3 w-3" />
              {doc}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor={`draw-stage-${request.id}`} className="text-xs font-medium text-slate-500">
          Update Stage
        </label>
        <select
          id={`draw-stage-${request.id}`}
          value={request.stage}
          onChange={(e) => onAdvance(request.id, Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          {drawRequestStages.map((label, i) => (
            <option key={label} value={i}>{label}</option>
          ))}
        </select>
      </div>
    </li>
  )
}

export default function LoanDetailSection() {
  const { loanNumber } = useParams()
  const number = `#${loanNumber}`
  const loan = pipelineLoans.find((l) => l.loanNumber === number)

  const [stage, setStage] = useState(loan?.stage)
  const [health, setHealth] = useState(loan?.health)
  const [savedAt, setSavedAt] = useState(null)
  const [sharedDocs, setSharedDocs] = useState([])
  const [drawRequests, setDrawRequests] = useState(
    () => (drawRequestsByLoanNumber[number] ?? []).map((r) => ({ ...r })),
  )
  const fileInputRef = useRef(null)

  if (!loan) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Loan {number} not found.
        <div className="mt-3">
          <Link to="/admin/tasks" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Back to Tasks
          </Link>
        </div>
      </div>
    )
  }

  const submittedDocs = recentUploads.filter((d) => d.loanNumber === number)
  const outstandingDocs = missingDocuments.filter((d) => d.loanNumber === number)
  const stageLabel = pipelineStages.find((s) => s.key === loan.stage)?.label ?? loan.stage

  function handleUpdateStatus(e) {
    e.preventDefault()
    loan.stage = stage
    loan.health = health
    setSavedAt('Just now')
  }

  function handleShareFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSharedDocs((prev) => [
      ...prev,
      { id: prev.length + 1, fileName: file.name, fileSize: formatFileSize(file.size), sharedAt: 'Just now' },
    ])
    e.target.value = ''
  }

  function handleAdvanceDraw(requestId, targetStage) {
    setDrawRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, stage: targetStage } : r)),
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/tasks"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {loan.loanNumber} &middot; {loan.borrower}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{loan.address}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${dealHealthConfig[loan.health]?.classes ?? 'bg-slate-100 text-slate-600'}`}>
            {loan.health}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Loan Amount</p>
            <p className="text-sm font-semibold text-slate-900">{loan.amount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Loan Officer</p>
            <p className="text-sm font-semibold text-slate-900">{loan.officer}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Stage</p>
            <p className="text-sm font-semibold text-slate-900">{stageLabel}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Days in Stage</p>
            <p className="text-sm font-semibold text-slate-900">{loan.daysInStage}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Update Loan Status</h2>
        <form onSubmit={handleUpdateStatus} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="stage" className="text-xs font-medium text-slate-500">Stage</label>
            <select
              id="stage"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            >
              {pipelineStages.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="health" className="text-xs font-medium text-slate-500">Deal Health</label>
            <select
              id="health"
              value={health}
              onChange={(e) => setHealth(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            >
              {healthOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Update Status
            </button>
            {savedAt && <span className="text-xs font-semibold text-emerald-700">Updated {savedAt}</span>}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Documents Submitted</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {submittedDocs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{doc.fileName}</p>
                  <p className="text-xs text-slate-400">{doc.uploadedBy} &middot; {doc.uploadedAt}</p>
                </div>
              </li>
            ))}
            {submittedDocs.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-400">No documents submitted yet.</li>
            )}
          </ul>

          {outstandingDocs.length > 0 && (
            <>
              <h3 className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-700">Still Needed</h3>
              <ul className="mt-2 divide-y divide-slate-100">
                {outstandingDocs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-semibold text-slate-900">{doc.document}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      {doc.daysOutstanding}d outstanding
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Share Documents with {loan.borrower}</h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Share a Document
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleShareFile} />
          </div>

          <ul className="mt-4 divide-y divide-slate-100">
            {sharedDocs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Share2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{doc.fileName}</p>
                  <p className="text-xs text-slate-400">{doc.fileSize} &middot; Shared {doc.sharedAt}</p>
                </div>
              </li>
            ))}
            {sharedDocs.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-400">Nothing shared with {loan.borrower} yet.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Draw Requests</h2>
        <ul className="mt-4 space-y-5 divide-y divide-slate-100">
          {drawRequests.map((request, i) => (
            <DrawRequestCard key={request.id} request={request} onAdvance={handleAdvanceDraw} isFirst={i === 0} />
          ))}
          {drawRequests.length === 0 && (
            <li className="flex items-center gap-3 py-2 text-sm text-slate-400">
              <HardHat className="h-4 w-4 shrink-0" />
              No draw requests submitted for this loan yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
