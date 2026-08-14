import { CircleCheck, Clock, PencilLine, CircleX, Upload, FileText, Download } from 'lucide-react'
import { documentsNeeded, documentsSent, documentStatusStyles } from '../data/dashboardData'

const statusIcons = { CircleCheck, Clock, PencilLine, CircleX }

function DocumentsNeededCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Documents Needed</h2>

      <ul className="mt-4 divide-y divide-slate-100">
        {documentsNeeded.map((doc) => {
          const config = documentStatusStyles[doc.status]
          const Icon = statusIcons[config.icon]
          const needsAction = doc.status !== 'Uploaded'

          return (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.classes}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.classes}`}>
                  {doc.status}
                </span>
                {needsAction && (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DocumentsSentCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Documents We Sent</h2>
      <p className="mt-1 text-sm text-slate-500">Borrowers can download everything anytime.</p>

      <ul className="mt-4 divide-y divide-slate-100">
        {documentsSent.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-400">Sent {doc.sentDate}</p>
              </div>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label={`Download ${doc.name}`}
            >
              <Download className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DocumentCenterSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <DocumentsNeededCard />
      <DocumentsSentCard />
    </div>
  )
}
