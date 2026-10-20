import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  FileText,
  Landmark,
  Loader2,
  LogOut,
  Paperclip,
  Plus,
  Search,
  Send,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../../common/auth/AuthContext'
import * as chatApi from '../../api/chats'
import { useChatSocket } from '../../hooks/useChatSocket'
import { LoanModal } from '../admin/LoansSection'

const kindIcons = { loan: Landmark, group: Users, direct: User }

const staffFilters = [
  { id: 'all', label: 'All' },
  { id: 'loan', label: 'Loans' },
  { id: 'group', label: 'Groups' },
  { id: 'direct', label: 'Direct' },
]

function displayName(user) {
  return user?.full_name?.trim() || user?.email || 'Someone'
}

function formatTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function preview(chat) {
  const last = chat.last_message
  if (!last) return 'No messages yet'
  if (last.kind === 'document_request') return `Document requested: ${last.body}`
  return last.body || 'Attachment'
}

function chatSubtitle(chat, isStaff) {
  if (chat.kind === 'loan') {
    if (!isStaff) return 'You and your loan team'
    const b = chat.borrower
    if (!b) return 'Borrower and loan team'
    return b.full_name?.trim() ? `${b.full_name.trim()} · ${b.email}` : b.email
  }
  if (chat.kind === 'group') return `${chat.members.length} members`
  return chat.members.map((m) => m.email).join(', ')
}

// Insert or replace a chat row and keep newest activity first, empty chats last
function upsertChat(chats, chat) {
  const rest = chats.filter((c) => c.id !== chat.id)
  return [chat, ...rest].sort((a, b) => {
    const at = a.last_message_at ? Date.parse(a.last_message_at) : -Infinity
    const bt = b.last_message_at ? Date.parse(b.last_message_at) : -Infinity
    return bt - at || b.id - a.id
  })
}

function appendMessages(existing, incoming) {
  const seen = new Set(existing.map((m) => m.id))
  return [...existing, ...incoming.filter((m) => !seen.has(m.id))]
}

function Avatar({ kind, className = '' }) {
  const Icon = kindIcons[kind] || User
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ${className}`}>
      <Icon className="h-4 w-4" />
    </span>
  )
}

function PeoplePicker({ excludeIds = [], onPick, placeholder = 'Search staff by name or email...' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const people = await chatApi.searchChatPeople(query.trim())
        if (!cancelled) setResults(people ?? [])
      } catch (err) {
        if (!cancelled) setError(chatApi.chatErrorText(err, 'Could not load staff'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  const visible = results.filter((p) => !excludeIds.includes(p.id))

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
        />
      </div>
      <ul className="mt-2 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
        {loading && visible.length === 0 && (
          <li className="px-3 py-3 text-center text-xs text-slate-400">Searching…</li>
        )}
        {error && <li className="px-3 py-3 text-center text-xs text-red-600">{error}</li>}
        {!loading && !error && visible.length === 0 && (
          <li className="px-3 py-3 text-center text-xs text-slate-400">No staff found.</li>
        )}
        {visible.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              onClick={() => onPick(person)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900">{displayName(person)}</span>
                <span className="block truncate text-xs text-slate-400">{person.email}</span>
              </span>
              <Plus className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NewChatPanel({ onCreated, onClose }) {
  const [mode, setMode] = useState('direct')
  const [name, setName] = useState('')
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function run(action) {
    setSaving(true)
    setError('')
    try {
      onCreated(await action())
    } catch (err) {
      setError(chatApi.chatErrorText(err, 'Could not start the chat'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">New chat</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {[
          { id: 'direct', label: 'Direct message' },
          { id: 'group', label: 'Internal group' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              mode === option.id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {mode === 'direct' ? (
          <>
            <p className="mb-2 text-sm text-slate-500">Choose a team member to message.</p>
            <PeoplePicker onPick={(person) => run(() => chatApi.startDirectChat(person.id))} />
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="new-group-name" className="text-xs font-semibold text-slate-600">
                Group name
              </label>
              <input
                id="new-group-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Closing team"
                maxLength={100}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            {members.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {members.map((m) => (
                  <span
                    key={m.id}
                    className="flex items-center gap-1 rounded-full bg-emerald-50 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-emerald-800"
                  >
                    {displayName(m)}
                    <button
                      type="button"
                      aria-label={`Remove ${displayName(m)}`}
                      onClick={() => setMembers((prev) => prev.filter((p) => p.id !== m.id))}
                      className="rounded-full p-0.5 hover:bg-emerald-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <PeoplePicker
              excludeIds={members.map((m) => m.id)}
              onPick={(person) => setMembers((prev) => [...prev, person])}
              placeholder="Add members..."
            />
            <p className="text-xs text-slate-400">Only staff can be in a group. You're added automatically.</p>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {mode === 'group' && (
        <button
          type="button"
          disabled={saving || !name.trim()}
          onClick={() => run(() => chatApi.createGroupChat(name.trim(), members.map((m) => m.id)))}
          className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create group'}
        </button>
      )}
    </div>
  )
}

function GroupMembers({ chat, me, onChanged, onLeft }) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function run(action) {
    setError('')
    try {
      await action()
    } catch (err) {
      setError(chatApi.chatErrorText(err, 'Could not update the group'))
    }
  }

  return (
    <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
      <ul className="flex flex-wrap gap-1.5">
        {chat.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-1 rounded-full bg-white py-1 pl-2.5 pr-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
          >
            {m.id === me.id ? 'You' : displayName(m)}
            {m.id !== me.id && (
              <button
                type="button"
                aria-label={`Remove ${displayName(m)}`}
                onClick={() => run(async () => {
                  await chatApi.removeChatMember(chat.id, m.id)
                  onChanged(await chatApi.fetchChat(chat.id))
                })}
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add people
        </button>
        <button
          type="button"
          onClick={() => run(async () => {
            await chatApi.removeChatMember(chat.id, me.id)
            onLeft(chat.id)
          })}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Leave group
        </button>
      </div>
      {adding && (
        <div className="mt-3">
          <PeoplePicker
            excludeIds={chat.members.map((m) => m.id)}
            onPick={(person) => run(async () => onChanged(await chatApi.addChatMembers(chat.id, [person.id])))}
            placeholder="Add a team member..."
          />
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function MessageItem({ message, mine, showSender }) {
  if (message.kind === 'system') {
    return (
      <li className="flex justify-center">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          {message.body} · {formatTime(message.created_at)}
        </span>
      </li>
    )
  }

  const bubble = mine ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'
  const meta = mine ? 'text-emerald-100' : 'text-slate-400'

  return (
    <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${bubble}`}>
        {showSender && !mine && (
          <p className="mb-0.5 text-xs font-semibold text-slate-600">{displayName(message.sender)}</p>
        )}
        {message.kind === 'document_request' ? (
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Document requested</p>
              <p className="text-sm font-semibold">{message.body}</p>
            </div>
          </div>
        ) : (
          message.body && <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
        )}
        {message.attachments?.length > 0 && (
          <ul className="mt-2 space-y-1">
            {message.attachments.map((file) => (
              <li key={file.id} className="flex items-center gap-2 text-sm">
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className={`shrink-0 text-[11px] ${meta}`}>{formatFileSize(file.size)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className={`mt-1 text-[11px] ${meta}`}>{formatTime(message.created_at)}</p>
      </div>
    </li>
  )
}

function ChatThread({ chat, thread, me, isStaff, onBack, onLoadOlder, onSent, onChatChanged, onLeft, onShowLoan }) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const bottomRef = useRef(null)
  const lastId = thread?.messages.at(-1)?.id

  // Follow new messages at the bottom; loading older ones doesn't change the last id.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lastId, chat.id])

  async function send() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    try {
      const message = await chatApi.sendMessage(chat.id, body)
      setDraft('')
      onSent(chat.id, message)
    } catch (err) {
      setError(chatApi.chatErrorText(err, 'Message not sent'))
    } finally {
      setSending(false)
    }
  }

  const showSender = chat.kind !== 'direct'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to chats"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Avatar kind={chat.kind} className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-slate-900">{chat.title || 'Chat'}</h2>
          <p className="truncate select-all text-xs text-slate-400">{chatSubtitle(chat, isStaff)}</p>
        </div>
        {isStaff && chat.kind === 'loan' && (
          <button
            type="button"
            onClick={onShowLoan}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Landmark className="h-3.5 w-3.5" />
            Loan details
          </button>
        )}
        {chat.kind === 'group' && (
          <button
            type="button"
            onClick={() => setShowMembers((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Users className="h-3.5 w-3.5" />
            Members
          </button>
        )}
      </div>

      {showMembers && chat.kind === 'group' && (
        <GroupMembers chat={chat} me={me} onChanged={onChatChanged} onLeft={onLeft} />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {thread?.hasMore && (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={thread.loading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {thread.loading ? 'Loading…' : 'Load older messages'}
            </button>
          </div>
        )}
        {!thread || (thread.loading && thread.messages.length === 0) ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : thread.error ? (
          <p className="py-10 text-center text-sm text-red-600">{thread.error}</p>
        ) : thread.messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No messages yet. Say hello.</p>
        ) : (
          <ul className="space-y-3">
            {thread.messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                mine={message.sender?.id === me.id}
                showSender={showSender}
              />
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="border-t border-slate-100 px-5 py-4"
      >
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            id={`chat-draft-${chat.id}`}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Type a message…"
            className="max-h-32 min-h-[42px] flex-1 resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send message"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">Enter to send, Shift+Enter for a new line.</p>
      </form>
    </div>
  )
}

/**
 * The chat inbox and conversation view, shared by the admin portal and the borrower portal.
 * Staff see loan chats, groups and direct messages and can start new ones; borrowers see
 * the chats of their own loans. New messages arrive live over the chat websocket.
 */
export default function ChatPanel({ initialChatId = null }) {
  const { user, isStaff } = useAuth()
  const [chats, setChats] = useState([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [listError, setListError] = useState('')
  const [activeId, setActiveId] = useState(initialChatId)
  const [threads, setThreads] = useState({})
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(initialChatId))
  // The loan whose details modal is open (staff, from a loan chat)
  const [openLoanId, setOpenLoanId] = useState(null)

  const activeIdRef = useRef(activeId)
  const chatsRef = useRef(chats)
  useEffect(() => {
    activeIdRef.current = activeId
    chatsRef.current = chats
  })

  const loadChats = useCallback(async () => {
    setListError('')
    try {
      const data = await chatApi.fetchChats({ page_size: 100 })
      setChats(data?.results ?? [])
    } catch (err) {
      setListError(chatApi.chatErrorText(err, 'Could not load your chats'))
    } finally {
      setLoadingChats(false)
    }
  }, [])

  const loadMessages = useCallback(async (chatId, before) => {
    setThreads((prev) => ({
      ...prev,
      [chatId]: { messages: [], hasMore: false, ...prev[chatId], loading: true, error: '' },
    }))
    try {
      const data = await chatApi.fetchMessages(chatId, { before })
      setThreads((prev) => {
        const current = prev[chatId]?.messages ?? []
        const messages = before ? appendMessages(data.results, current) : appendMessages(current, data.results)
        if (!before) messages.sort((a, b) => a.id - b.id)
        return {
          ...prev,
          [chatId]: {
            messages,
            hasMore: before || current.length === 0 ? data.has_more : prev[chatId]?.hasMore,
            loading: false,
            error: '',
          },
        }
      })
    } catch (err) {
      setThreads((prev) => ({
        ...prev,
        [chatId]: { ...prev[chatId], loading: false, error: chatApi.chatErrorText(err, 'Could not load messages') },
      }))
    }
  }, [])

  const markRead = useCallback(async (chatId) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unread_count: 0 } : c)))
    try {
      await chatApi.markChatRead(chatId)
    } catch {
      // The badge comes back on the next inbox load; nothing else to do.
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  // Open the chat that was asked for, or the newest one on wide screens.
  useEffect(() => {
    if (activeId != null || chats.length === 0) return
    if (window.matchMedia('(min-width: 1024px)').matches) setActiveId(chats[0].id)
  }, [chats, activeId])

  useEffect(() => {
    if (activeId == null) return
    if (!threads[activeId]) loadMessages(activeId)
    if (chats.find((c) => c.id === activeId)?.unread_count) markRead(activeId)
  }, [activeId, chats, threads, loadMessages, markRead])

  const receiveMessage = useCallback((chatId, message) => {
    setThreads((prev) =>
      prev[chatId] ? { ...prev, [chatId]: { ...prev[chatId], messages: appendMessages(prev[chatId].messages, [message]) } } : prev,
    )
    setChats((prev) => {
      const chat = prev.find((c) => c.id === chatId)
      if (!chat) return prev
      const fromOther = message.sender?.id !== user?.id
      const unread = chatId === activeIdRef.current || !fromOther ? 0 : chat.unread_count + 1
      return upsertChat(prev, {
        ...chat,
        last_message: { kind: message.kind, body: message.body, at: message.created_at },
        last_message_at: message.created_at,
        unread_count: unread,
      })
    })
  }, [user?.id])

  useChatSocket({
    onOpen: (reconnected) => {
      if (!reconnected) return
      // Catch up on anything sent while the connection was down.
      loadChats()
      if (activeIdRef.current != null) loadMessages(activeIdRef.current)
    },
    onEvent: (event) => {
      if (event.type === 'message') {
        if (!chatsRef.current.some((c) => c.id === event.chat)) {
          loadChats()
          return
        }
        receiveMessage(event.chat, event.message)
        if (event.chat === activeIdRef.current && event.message.sender?.id !== user?.id) markRead(event.chat)
      } else if (event.type === 'read') {
        setChats((prev) => prev.map((c) => (c.id === event.chat ? { ...c, unread_count: 0 } : c)))
      } else if (event.type === 'removed') {
        setChats((prev) => prev.filter((c) => c.id !== event.chat))
        if (activeIdRef.current === event.chat) setActiveId(null)
      }
    },
  })

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (c) =>
      [c.title, c.borrower?.email, c.borrower?.full_name].some((text) => (text || '').toLowerCase().includes(q))
    return chats.filter((c) => (filter === 'all' || c.kind === filter) && (!q || matches(c)))
  }, [chats, filter, query])

  const activeChat = chats.find((c) => c.id === activeId) || null

  function openChat(chatId) {
    setCreating(false)
    setActiveId(chatId)
    setMobileThreadOpen(true)
  }

  function handleCreated(chat) {
    setChats((prev) => upsertChat(prev, chat))
    openChat(chat.id)
  }

  function handleLeft(chatId) {
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    setActiveId(null)
    setMobileThreadOpen(false)
  }

  const showThreadOnMobile = mobileThreadOpen && (creating || activeChat)

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[32rem] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <aside
        className={`w-full shrink-0 flex-col border-r border-slate-100 lg:flex lg:w-80 ${
          showThreadOnMobile ? 'hidden' : 'flex'
        }`}
      >
        <div className="space-y-3 border-b border-slate-100 p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="chat-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isStaff ? 'Search by name or email...' : 'Search chats...'}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            {isStaff && (
              <button
                type="button"
                onClick={() => {
                  setCreating(true)
                  setMobileThreadOpen(true)
                }}
                aria-label="New chat"
                title="New chat"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          {isStaff && (
            <div className="flex gap-1.5">
              {staffFilters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    filter === f.id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
          {loadingChats && (
            <li className="flex justify-center py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </li>
          )}
          {listError && <li className="px-4 py-6 text-center text-sm text-red-600">{listError}</li>}
          {!loadingChats && !listError && filteredChats.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-slate-400">
              {chats.length === 0
                ? isStaff
                  ? 'No chats yet. Loan chats appear here, or start one with +.'
                  : 'No messages yet. Chats with your loan team will appear here.'
                : 'No chats match.'}
            </li>
          )}
          {filteredChats.map((chat) => {
            const unread = chat.unread_count > 0
            return (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => openChat(chat.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                    chat.id === activeId && !creating ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <Avatar kind={chat.kind} className="mt-0.5 h-8 w-8" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm text-slate-900 ${unread ? 'font-bold' : 'font-semibold'}`}>
                        {chat.title || 'Chat'}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">{formatTime(chat.last_message_at)}</span>
                    </div>
                    {isStaff && chat.kind === 'loan' && chat.borrower && (
                      <p className="truncate text-[11px] text-slate-400">{chat.borrower.email}</p>
                    )}
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-xs ${unread ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
                        {preview(chat)}
                      </p>
                      {unread && (
                        <span className="shrink-0 rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums">
                          {chat.unread_count > 99 ? '99+' : chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <section className={`min-w-0 flex-1 flex-col lg:flex ${showThreadOnMobile ? 'flex' : 'hidden'}`}>
        {creating ? (
          <NewChatPanel
            onCreated={handleCreated}
            onClose={() => {
              setCreating(false)
              setMobileThreadOpen(false)
            }}
          />
        ) : activeChat ? (
          <ChatThread
            key={activeChat.id}
            chat={activeChat}
            thread={threads[activeChat.id]}
            me={user}
            isStaff={isStaff}
            onBack={() => setMobileThreadOpen(false)}
            onLoadOlder={() => loadMessages(activeChat.id, threads[activeChat.id]?.messages[0]?.id)}
            onSent={receiveMessage}
            onChatChanged={(chat) => setChats((prev) => upsertChat(prev, chat))}
            onLeft={handleLeft}
            onShowLoan={() => setOpenLoanId(activeChat.loan)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-400">
            Choose a chat to start messaging.
          </div>
        )}
      </section>

      {isStaff && openLoanId != null && <LoanModal loanId={openLoanId} onClose={() => setOpenLoanId(null)} />}
    </div>
  )
}
