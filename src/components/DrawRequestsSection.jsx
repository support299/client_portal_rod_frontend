import { useState } from 'react'
import { Camera, Receipt, ClipboardCheck, MessageSquare, Upload, Check, Plus, X, Clock } from 'lucide-react'
import { drawRequestStages } from '../common/constants/uiStyles'
import PropertySelector from './PropertySelector'

const currency = (value) => `$${value.toLocaleString('en-US')}`

function ConstructionBudgetCard({ budget }) {
  const { total, released, remaining } = budget
  const percentReleased = total > 0 ? Math.round((released / total) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Construction Budget</h2>
      <p className="mt-1 text-sm text-slate-500">
        Especially useful for Fix &amp; Flip and Ground-Up.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-400">Total Budget</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{currency(total)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Released</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{currency(released)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Remaining</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{currency(remaining)}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>{percentReleased}% released</span>
          <span>{currency(total)}</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-600"
            style={{ width: `${percentReleased}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function UploadField({ label, icon: Icon, files, onChange }) {
  const inputId = `upload-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div>
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-6 text-center hover:border-emerald-300 hover:bg-emerald-50"
      >
        <Icon className="h-5 w-5 text-slate-400" />
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-xs text-slate-400">
          {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload'}
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => onChange(Array.from(e.target.files))}
      />
    </div>
  )
}

function RequestDrawForm({ onClose, onSubmit }) {
  const [photos, setPhotos] = useState([])
  const [invoices, setInvoices] = useState([])
  const [inspectionFiles, setInspectionFiles] = useState([])
  const [comment, setComment] = useState('')
  const [amount, setAmount] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ amount, comment })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Request a Draw</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close form"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4">
        <label htmlFor="draw-amount" className="text-sm font-medium text-slate-700">
          Requested Amount
        </label>
        <input
          id="draw-amount"
          type="text"
          placeholder="$0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none sm:w-64"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UploadField label="Photos" icon={Camera} files={photos} onChange={setPhotos} />
        <UploadField label="Invoices" icon={Receipt} files={invoices} onChange={setInvoices} />
        <UploadField
          label="Inspection Request"
          icon={ClipboardCheck}
          files={inspectionFiles}
          onChange={setInspectionFiles}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="draw-comment" className="text-sm font-medium text-slate-700">
          Comments
        </label>
        <textarea
          id="draw-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add any notes for your loan officer..."
          className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
        />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Upload className="h-4 w-4" />
          Submit Draw Request
        </button>
      </div>
    </form>
  )
}

function DrawStepper({ stage }) {
  return (
    <div className="flex items-center">
      {drawRequestStages.map((label, i) => (
        <div key={label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                i < stage
                  ? 'bg-emerald-600 text-white'
                  : i === stage
                    ? 'border-2 border-emerald-600 bg-white text-emerald-600'
                    : 'border-2 border-slate-200 bg-white text-slate-300'
              }`}
            >
              {i < stage ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={`whitespace-nowrap text-[11px] font-medium ${
                i <= stage ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              {label}
            </span>
          </div>
          {i < drawRequestStages.length - 1 && (
            <div className={`mx-1.5 h-0.5 flex-1 ${i < stage ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function NotYetAvailableCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Clock className="h-6 w-6" />
      </div>
      <p className="mt-4 text-base font-semibold text-slate-900">Draws not available yet</p>
      <p className="mt-1 text-sm text-slate-500">
        This loan hasn&apos;t closed yet. Draw requests open up once funding is complete.
      </p>
    </div>
  )
}

export default function DrawRequestsSection({ properties = [] }) {
  const [selectedProperty, setSelectedProperty] = useState(properties[0] ?? null)
  const [requestsByLoan, setRequestsByLoan] = useState({})
  const [formOpen, setFormOpen] = useState(false)

  if (properties.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-500">Select a funded loan to manage draw requests.</p>
      </div>
    )
  }

  const propertyId = selectedProperty?.id
  const budget = selectedProperty?.constructionBudget ?? { total: 0, released: 0, remaining: 0 }
  const requests = propertyId != null ? (requestsByLoan[propertyId] ?? []) : []
  const hasFunding = budget.total > 0

  const handleSubmit = ({ amount, comment }) => {
    if (propertyId == null) return
    const nextId = requests.length ? Math.max(...requests.map((r) => r.id)) + 1 : 1
    setRequestsByLoan({
      ...requestsByLoan,
      [propertyId]: [
        {
          id: nextId,
          label: `Draw #${nextId}`,
          amount: amount || '$0.00',
          requestedDate: 'Today',
          stage: 0,
          comment: comment || 'No comments provided.',
        },
        ...requests,
      ],
    })
    setFormOpen(false)
  }

  return (
    <div className="space-y-6">
      <PropertySelector
        properties={properties}
        selected={selectedProperty}
        onChange={(property) => {
          setSelectedProperty(property)
          setFormOpen(false)
        }}
      />

      {!hasFunding ? (
        <NotYetAvailableCard />
      ) : (
        <>
          <ConstructionBudgetCard budget={budget} />

          {formOpen ? (
            <RequestDrawForm onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Need funds for your next milestone?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload photos, invoices, and an inspection request to get started.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <Plus className="h-4 w-4" />
                Request Draw
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Draw History</h2>
            {requests.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No draws requested yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {requests.map((request) => (
                  <li key={request.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {request.label} &middot; {request.amount}
                      </p>
                      <p className="text-xs text-slate-400">Requested {request.requestedDate}</p>
                    </div>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-500">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {request.comment}
                    </p>
                    <div className="mt-4">
                      <DrawStepper stage={request.stage} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
