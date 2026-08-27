import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  upcomingEvents,
  properties,
  loanSummaries,
  insuranceCertificates,
} from '../data/dashboardData'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const eventTypeLabels = {
  event: 'Event',
  payment: 'Payment Due',
  closing: 'Closing',
  maturity: 'Maturity',
  insurance: 'Insurance',
}

const eventTypeStyles = {
  event: { dot: 'bg-emerald-600', label: 'bg-emerald-100 text-emerald-700' },
  payment: { dot: 'bg-blue-600', label: 'bg-blue-100 text-blue-700' },
  closing: { dot: 'bg-violet-600', label: 'bg-violet-100 text-violet-700' },
  maturity: { dot: 'bg-amber-600', label: 'bg-amber-100 text-amber-800' },
  insurance: { dot: 'bg-red-600', label: 'bg-red-100 text-red-700' },
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function isSameDay(a, b) {
  return dayKey(a) === dayKey(b)
}

function getMonthGrid(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7

  return Array.from({ length: totalCells }, (_, i) => {
    const date = new Date(year, month, i - startWeekday + 1)
    return { date, inMonth: date.getMonth() === month }
  })
}

function buildCalendarEvents() {
  const raw = [
    ...upcomingEvents.map((e) => ({
      id: `event-${e.id}`,
      date: e.date,
      time: e.time,
      title: e.title,
      type: 'event',
    })),
    ...properties
      .filter((p) => p.nextPaymentDate && p.nextPaymentDate !== '—')
      .map((p) => ({
        id: `payment-${p.id}`,
        date: p.nextPaymentDate,
        title: `Payment Due — ${p.address}`,
        type: 'payment',
      })),
    ...loanSummaries
      .filter((l) => l.closingDate && l.closingDate !== 'Pending')
      .map((l) => ({
        id: `closing-${l.id}`,
        date: l.closingDate,
        title: `${l.loanName} Closing`,
        type: 'closing',
      })),
    ...loanSummaries
      .filter((l) => l.maturityDate && l.maturityDate !== 'TBD')
      .map((l) => ({
        id: `maturity-${l.id}`,
        date: l.maturityDate,
        title: `${l.loanName} Maturity`,
        type: 'maturity',
      })),
    ...insuranceCertificates.map((c) => ({
      id: `insurance-${c.id}`,
      date: c.expiration,
      title: `${c.provider} Policy Expires`,
      type: 'insurance',
    })),
  ]

  return raw
    .map((evt) => ({ ...evt, parsedDate: parseDate(evt.date) }))
    .filter((evt) => evt.parsedDate !== null)
}

const calendarEvents = buildCalendarEvents()

const eventsByDay = calendarEvents.reduce((map, evt) => {
  const key = dayKey(evt.parsedDate)
  if (!map.has(key)) map.set(key, [])
  map.get(key).push(evt)
  return map
}, new Map())

export default function CalendarSection() {
  const today = useMemo(() => new Date(), [])
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(today)

  const cells = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth])
  const selectedEvents = eventsByDay.get(dayKey(selectedDate)) ?? []
  const monthLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function goToMonth(offset) {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  function goToToday() {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-px overflow-hidden rounded-t-lg border border-b-0 border-slate-100 bg-slate-100 text-center text-xs font-semibold text-slate-400">
          {WEEKDAY_LABELS.map((day) => (
            <div key={day} className="bg-white py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg border border-t-0 border-slate-100 bg-slate-100">
          {cells.map(({ date, inMonth }) => {
            const key = dayKey(date)
            const dayEvents = eventsByDay.get(key) ?? []
            const isToday = isSameDay(date, today)
            const isSelected = isSameDay(date, selectedDate)

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`flex h-20 flex-col items-start gap-1.5 bg-white p-2 text-left transition-colors hover:bg-slate-50 sm:h-24 ${
                  isSelected ? 'ring-2 ring-inset ring-emerald-600' : ''
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? 'bg-emerald-700 text-white'
                      : inMonth
                        ? 'text-slate-700'
                        : 'text-slate-300'
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="flex flex-wrap gap-1">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <span
                      key={evt.id}
                      className={`h-1.5 w-1.5 rounded-full ${eventTypeStyles[evt.type].dot}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">
          {isSameDay(selectedDate, today)
            ? 'Today'
            : selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
        </h2>

        {selectedEvents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No events on this day.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {selectedEvents.map((evt) => (
              <li key={evt.id} className="rounded-lg border border-slate-100 p-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${eventTypeStyles[evt.type].label}`}
                >
                  {eventTypeLabels[evt.type]}
                </span>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{evt.title}</p>
                {evt.time && <p className="text-xs text-slate-400">{evt.time}</p>}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Upcoming
          </h3>
          <ul className="mt-3 space-y-3">
            {upcomingEvents.map((evt) => (
              <li key={evt.id} className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700">{evt.title}</p>
                <p className="text-xs text-slate-400">{evt.date}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
