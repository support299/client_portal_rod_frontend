import { RefreshCw } from 'lucide-react'
import { crmSyncStyles } from '../../common/constants/uiStyles'

export default function CrmSection({ crmRecords = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">CRM Sync Status</h2>
          <p className="mt-1 text-sm text-slate-500">Deal records mirrored from the connected CRM.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Now
        </button>
      </div>

      {crmRecords.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No CRM records synced yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {crmRecords.map((record) => (
            <li key={record.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{record.borrower}</p>
                  <span className="text-xs text-slate-400">{record.loanNumber}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {record.crmId} &middot; {record.dealStage} &middot; Source: {record.leadSource}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(record.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${crmSyncStyles[record.syncStatus] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {record.syncStatus}
                </span>
                <p className="mt-1 text-xs text-slate-400">Last synced {record.lastSynced}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
