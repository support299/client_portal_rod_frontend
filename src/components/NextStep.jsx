import { CircleCheck, FileUp, Hourglass, Wallet } from 'lucide-react'
import { money } from '../utils/draws'
import { formatDate } from '../utils/format'

const tones = {
  action: { box: 'border-amber-200 bg-amber-50', icon: 'bg-white text-amber-600 ring-amber-100', Icon: FileUp },
  waiting: { box: 'border-blue-200 bg-blue-50', icon: 'bg-white text-blue-600 ring-blue-100', Icon: Hourglass },
  funded: { box: 'border-emerald-200 bg-emerald-50', icon: 'bg-white text-emerald-600 ring-emerald-100', Icon: Wallet },
  done: { box: 'border-emerald-200 bg-emerald-50', icon: 'bg-white text-emerald-600 ring-emerald-100', Icon: CircleCheck },
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Days from today to a YYYY-MM-DD date, or null when there's no date
export function daysUntil(date) {
  if (!date) return null
  const target = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86_400_000)
}

// The one thing the borrower should do now, worked out from the loan's documents, stage and draws
function nextStep(detail) {
  const { needed, inReview, funded, drawSummary, draws, loan } = detail
  const closeDate = loan.raw?.expected_close_date
  const closingAhead = daysUntil(closeDate) > 0

  if (needed.length) {
    const changes = needed.filter((r) => r.status !== 'requested')
    const overdue = needed.filter((r) => r.due_date && daysUntil(r.due_date) < 0)
    const body = [
      changes.length && `Your loan team asked for changes to ${changes.map((r) => r.name).join(', ')}.`,
      overdue.length && `${plural(overdue.length, 'document')} ${overdue.length === 1 ? 'is' : 'are'} past due.`,
      !changes.length && !overdue.length && 'Your file keeps moving as soon as these are in.',
    ].filter(Boolean)
    return {
      tone: 'action',
      title: `Upload ${plural(needed.length, 'document')}${closingAhead ? ` to stay on track for ${formatDate(closeDate)}` : ''}`,
      body: body.join(' '),
      action: { label: needed.length === 1 ? 'Upload document' : 'Upload documents', target: 'checklist' },
    }
  }

  if (funded) {
    const open = draws.find((d) => !['funded', 'rejected', 'cancelled'].includes(d.status))
    const available = drawSummary?.available
    return {
      tone: 'funded',
      title: open ? `Draw #${open.number} is in progress` : 'Your loan is funded. Request a draw when work is done.',
      body:
        available != null
          ? `Rehab funds available: ${money(available)} of ${money(drawSummary.holdback)}.`
          : 'Request rehab funds as work on the property is completed.',
      action: { label: open ? 'View draw requests' : 'Request a draw', target: 'draw-requests' },
    }
  }

  return {
    tone: inReview.length ? 'waiting' : 'done',
    title: 'Nothing needed from you right now',
    body: inReview.length
      ? `We’re reviewing ${plural(inReview.length, 'document')} you sent. We’ll let you know if anything else is needed.`
      : detail.stageNote || 'We’ll let you know here as soon as we need anything from you.',
    action: { label: 'Message your loan officer', target: 'messages' },
  }
}

export default function NextStep({ detail, onNavigate, onShowChecklist }) {
  const step = nextStep(detail)
  const { box, icon, Icon } = tones[step.tone]

  return (
    <section
      aria-live="polite"
      className={`flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${box}`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${icon}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your next step</p>
          <h2 className="mt-0.5 text-lg font-bold text-slate-900">{step.title}</h2>
          {step.body && <p className="mt-1 max-w-xl text-sm text-slate-600">{step.body}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => (step.action.target === 'checklist' ? onShowChecklist() : onNavigate(step.action.target))}
        className="shrink-0 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
      >
        {step.action.label}
      </button>
    </section>
  )
}
