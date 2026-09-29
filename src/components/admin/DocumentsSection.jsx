import { AlertTriangle, FileText, Send } from 'lucide-react'

function urgencyClasses(days) {
  if (days >= 10) return 'bg-red-100 text-red-700'
  if (days >= 5) return 'bg-amber-100 text-amber-800'
  return 'bg-slate-100 text-slate-600'
}

function MissingDocumentsCard({ missingDocuments = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Missing Borrower Documents</h2>
      <p className="mt-1 text-sm text-slate-500">Outstanding conditions blocking progress.</p>

      {missingDocuments.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No missing documents.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {missingDocuments.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{doc.document}</p>
                  <p className="text-xs text-slate-400">
                    {doc.borrower} &middot; {doc.loanNumber} &middot; Requested {doc.requestedDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${urgencyClasses(doc.daysOutstanding)}`}
                >
                  {doc.daysOutstanding}d outstanding
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  Nudge
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RecentUploadsCard({ recentUploads = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Recently Uploaded Files</h2>
      <p className="mt-1 text-sm text-slate-500">Latest files added across all loans.</p>

      {recentUploads.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No recent uploads.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {recentUploads.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-3 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{file.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {file.borrower} &middot; {file.loanNumber} &middot; {file.uploadedBy}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{file.uploadedAt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DocumentsSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <MissingDocumentsCard />
      <RecentUploadsCard />
    </div>
  )
}
