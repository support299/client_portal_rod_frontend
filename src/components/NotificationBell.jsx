import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Banknote, CheckCheck, FileText, UserPlus } from 'lucide-react'
import {
  fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationRead,
} from '../api/notifications'
import { useAuth } from '../common/auth/AuthContext'
import { useChatSocket } from '../hooks/useChatSocket'
import { errorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'
import { LoanModal } from './admin/LoansSection'

const PAGE_SIZE = 20

// Keyed by Notification.Kind: [icon, icon classes, borrower portal section, staff loan panel tab]
const kinds = {
  draw_submitted: [Banknote, 'bg-emerald-100 text-emerald-700', 'draw-requests', 'draws'],
  draw_status: [Banknote, 'bg-emerald-100 text-emerald-700', 'draw-requests', 'draws'],
  document_requested: [FileText, 'bg-amber-100 text-amber-800', 'documents', 'documents'],
  document_uploaded: [FileText, 'bg-blue-100 text-blue-700', 'documents', 'documents'],
  document_reviewed: [FileText, 'bg-blue-100 text-blue-700', 'documents', 'documents'],
  loan_assigned: [UserPlus, 'bg-indigo-100 text-indigo-700', 'dashboard', 'details'],
}

function timeAgo(value) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h ago`
  if (minutes < 7 * 24 * 60) return `${Math.round(minutes / (24 * 60))}d ago`
  return formatDate(value)
}

function NotificationItem({ notification, onOpen }) {
  const [Icon, iconClasses] = kinds[notification.kind] ?? [Bell, 'bg-slate-100 text-slate-500']
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${notification.is_read ? '' : 'bg-emerald-50/50'}`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm ${notification.is_read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>
            {notification.title}
          </span>
          {notification.body && (
            <span className="mt-0.5 line-clamp-2 block whitespace-pre-line text-xs text-slate-500">{notification.body}</span>
          )}
          <span className="mt-1 block text-[11px] text-slate-400">
            {[notification.loan_name, notification.actor_name, timeAgo(notification.created_at)].filter(Boolean).join(' · ')}
          </span>
        </span>
        {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-label="Unread" />}
      </button>
    </li>
  )
}

/**
 * The bell in the top bar: unread badge, the latest notifications, live updates over the shared
 * socket. Borrowers go to the matching portal section; staff get the loan panel on the right tab.
 */
export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isBorrower = user?.role === 'borrower'
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState([])
  const [next, setNext] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loanPanel, setLoanPanel] = useState(null)
  const ref = useRef(null)

  const refreshCount = useCallback(() => {
    fetchUnreadCount()
      .then((data) => setUnread(data?.unread_count ?? 0))
      .catch(() => {})
  }, [])

  const loadPage = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchNotifications({ page, page_size: PAGE_SIZE })
      setItems((prev) => (page === 1 ? data.results : [...prev, ...data.results]))
      setNext(data.next ? page + 1 : null)
      setUnread(data.unread_count ?? 0)
      setLoaded(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCount()
  }, [refreshCount])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useChatSocket({
    onOpen: (reconnected) => {
      if (!reconnected) return
      // Catch up on anything sent while the connection was down.
      refreshCount()
      if (loaded) loadPage(1)
    },
    onEvent: (event) => {
      if (event.type !== 'notification') return
      setUnread(event.unread_count)
      setItems((prev) => (prev.some((n) => n.id === event.notification.id) ? prev : [event.notification, ...prev]))
    },
  })

  function toggle() {
    const opening = !open
    setOpen(opening)
    if (opening) loadPage(1)
  }

  async function openNotification(notification) {
    setOpen(false)
    if (!notification.is_read) {
      setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
      markNotificationRead(notification.id)
        .then((data) => setUnread(data?.unread_count ?? 0))
        .catch(() => {})
    }
    if (notification.loan == null) return
    const [, , section, tab] = kinds[notification.kind] ?? []
    if (isBorrower) {
      const path = !section || section === 'dashboard' ? '/' : `/${section}`
      navigate({ pathname: path, search: `?loan=${notification.loan}` })
    } else {
      setLoanPanel({ loanId: notification.loan, tab: tab ?? 'details' })
    }
  }

  async function readAll() {
    try {
      await markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnread(0)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={readAll}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
            {!loaded && loading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
            ) : items.length === 0 && !error ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => (
                  <NotificationItem key={n.id} notification={n} onOpen={openNotification} />
                ))}
              </ul>
            )}
            {next && (
              <button
                type="button"
                disabled={loading}
                onClick={() => loadPage(next)}
                className="w-full border-t border-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? 'Loading…' : 'Show older'}
              </button>
            )}
          </div>
        </div>
      )}

      {loanPanel && (
        <LoanModal
          key={`${loanPanel.loanId}-${loanPanel.tab}`}
          loanId={loanPanel.loanId}
          initialTab={loanPanel.tab}
          onClose={() => setLoanPanel(null)}
        />
      )}
    </div>
  )
}
