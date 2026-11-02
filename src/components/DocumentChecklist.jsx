import { forwardRef, useState } from 'react'
import { CircleCheck, Clock } from 'lucide-react'
import { RequestItem } from './DocumentCenterSection'
import { formatDate } from '../utils/format'

function GroupLabel({ className, children }) {
  return (
    <p className="mt-5">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
    </p>
  )
}

// The loan's document requests as a checklist: what's still needed (with upload), what's being
// reviewed, and what's done (folded away)
const DocumentChecklist = forwardRef(function DocumentChecklist({ detail, userId, onChanged, onNavigate }, ref) {
  const [error, setError] = useState('')
  const [showReceived, setShowReceived] = useState(false)
  const { loan, requests, needed, inReview, received } = detail
  const total = requests.length
  const inHand = inReview.length + received.length
  const percent = total ? Math.round((inHand / total) * 100) : 0

  return (
    <section ref={ref} className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Documents</h2>
        {total > 0 && (
          <span className="text-sm tabular-nums text-slate-500">
            {inHand} of {total} received
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No documents requested yet. Your loan officer will list anything they need here.
        </p>
      ) : (
        <>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Documents received"
          >
            <div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${percent}%` }} />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}{' '}
              <button type="button" onClick={() => setError('')} className="font-semibold underline">
                Dismiss
              </button>
            </p>
          )}

          {needed.length > 0 && (
            <>
              <GroupLabel className="bg-amber-100 text-amber-800">Needed from you</GroupLabel>
              <ul className="mt-1 divide-y divide-slate-100">
                {needed.map((request) => (
                  <RequestItem
                    key={request.id}
                    loanId={loan.id}
                    request={request}
                    userId={userId}
                    onChanged={onChanged}
                    onError={setError}
                  />
                ))}
              </ul>
            </>
          )}

          {inReview.length > 0 && (
            <>
              <GroupLabel className="bg-blue-100 text-blue-700">We’re reviewing</GroupLabel>
              <ul className="mt-2 divide-y divide-slate-100">
                {inReview.map((request) => {
                  const latest = request.documents?.[request.documents.length - 1]
                  return (
                    <li key={request.id} className="flex items-center gap-3 py-3">
                      <Clock className="h-4 w-4 shrink-0 text-blue-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{request.name}</p>
                        {latest?.uploaded_at && (
                          <p className="text-xs text-slate-400">Uploaded {formatDate(latest.uploaded_at)}</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {received.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <CircleCheck className="h-4 w-4 text-emerald-500" />
                  {received.length} document{received.length === 1 ? '' : 's'} approved
                </p>
                <button
                  type="button"
                  aria-expanded={showReceived}
                  onClick={() => setShowReceived((v) => !v)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {showReceived ? 'Hide' : 'Show'}
                </button>
              </div>
              {showReceived && (
                <ul className="mt-2 space-y-1 pl-6 text-sm text-slate-600">
                  {received.map((request) => (
                    <li key={request.id}>{request.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => onNavigate('documents')}
        className="mt-5 text-sm font-semibold text-emerald-700 hover:underline"
      >
        Open all documents
      </button>
    </section>
  )
})

export default DocumentChecklist
