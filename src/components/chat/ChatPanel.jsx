import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  FilePlus2,
  FileText,
  Landmark,
  Loader2,
  LogOut,
  Paperclip,
  Plus,
  Search,
  Send,
  Upload,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../../common/auth/AuthContext'
import * as chatApi from '../../api/chats'
import { fetchDocumentFile, fetchDocumentTypes, openBlob } from '../../api/documents'
import { useChatSocket } from '../../hooks/useChatSocket'
import { formatDate } from '../../utils/format'
import { RequestForm } from '../admin/LoanDocuments'
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
  // A document request's body starts with "Document requested: <name>"
  if (last.kind === 'document_request') return last.body.split('\n')[0]
  return last.body || 'Sent a file'
}

// Keyed by DocumentRequest.Status
const requestBadges = {
  requested: ['Needed', 'bg-amber-100 text-amber-800'],
  needs_revision: ['Needs revision', 'bg-amber-100 text-amber-800'],
  rejected: ['Rejected', 'bg-red-100 text-red-700'],
  pending_review: ['In review', 'bg-blue-100 text-blue-700'],
  uploaded: ['Received', 'bg-emerald-100 text-emerald-700'],
}

// Keep request cards current as messages arrive: a file sent in a loan chat answers its request,
// which then waits for review; a newer card for the same request (e.g. after a rejection)
// replaces the older one, which falls back to plain text, as it does when loaded from the API
function updateRequestCards(messages, message) {
  const answered = new Set(message.attachments?.map((a) => a.request).filter(Boolean))
  const moved = message.document_request?.id
  if (answered.size === 0 && moved == null) return messages
  return messages.map((m) => {
    const request = m.document_request
    if (!request || m.id === message.id) return m
    if (request.id === moved) return { ...m, document_request: null }
    if (answered.has(request.id) && request.status !== 'uploaded') {
      return { ...m, document_request: { ...request, status: 'pending_review' } }
    }
    return m
  })
}

async function openFile(file, onError) {
  try {
    openBlob(await fetchDocumentFile(file.download_url))
  } catch (err) {
    onError(chatApi.chatErrorText(err, 'Could not open the file'))
  }
}

// Hidden file input; ref.current.click() opens the picker
function HiddenFileInput({ inputRef, onFile }) {
  return (
    <input
      ref={inputRef}
      type="file"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (file) onFile(file)
      }}
    />
  )
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

function DocumentRequestCard({ request, body, isStaff, onUpload, onOpenDocuments, onError }) {
  const input = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [label, classes] = requestBadges[request.status] ?? requestBadges.requested
  const awaitingFile = ['requested', 'needs_revision', 'rejected'].includes(request.status)
  const revision = ['needs_revision', 'rejected'].includes(request.status)
  // A rejection's message starts with which file wasn't accepted
  const headline = revision && body && !body.startsWith('Document requested') ? body.split('\n')[0] : null

  async function upload(file) {
    setUploading(true)
    try {
      await onUpload(file, request.id)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-72 max-w-full rounded-xl bg-white p-3 text-slate-800 ring-1 ring-slate-200">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {revision ? 'New version needed' : 'Document requested'}
          </p>
          <p className="text-sm font-semibold">{request.name}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${classes}`}>{label}</span>
      </div>
      {headline && <p className="mt-1.5 text-xs text-slate-700">{headline}</p>}
      {request.description && <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-600">{request.description}</p>}
      {request.due_date && <p className="mt-1 text-xs text-slate-500">Due {formatDate(request.due_date)}</p>}
      {request.reviewer_note && ['needs_revision', 'rejected'].includes(request.status) && (
        <p className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800">Reason: {request.reviewer_note}</p>
      )}
      {request.form_document && (
        <button
          type="button"
          onClick={() => openFile(request.form_document, onError)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg bg-purple-50 px-2 py-1.5 text-left text-xs font-medium text-purple-800 hover:bg-purple-100"
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Form to fill in: {request.form_document.name}</span>
        </button>
      )}
      {request.status !== 'uploaded' && (
        <>
          <button
            type="button"
            disabled={uploading}
            onClick={() => input.current?.click()}
            className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
              awaitingFile && !isStaff
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading
              ? 'Uploading…'
              : isStaff
                ? 'Upload for borrower'
                : revision
                  ? 'Upload new version'
                  : awaitingFile
                    ? 'Upload'
                    : 'Add another file'}
          </button>
          <HiddenFileInput inputRef={input} onFile={upload} />
        </>
      )}
      {onOpenDocuments && (
        <button
          type="button"
          onClick={onOpenDocuments}
          className="mt-1.5 w-full text-center text-xs font-semibold text-emerald-700 hover:underline"
        >
          Open Documents
        </button>
      )}
    </div>
  )
}

function MessageItem({ message, mine, showSender, isStaff, onUploadForRequest, onOpenDocuments, onError }) {
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

  if (message.kind === 'document_request' && message.document_request) {
    return (
      <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[85%] sm:max-w-[70%]">
          {showSender && !mine && (
            <p className="mb-0.5 text-xs font-semibold text-slate-600">{displayName(message.sender)}</p>
          )}
          <DocumentRequestCard
            request={message.document_request}
            body={message.body}
            isStaff={isStaff}
            onUpload={onUploadForRequest}
            onOpenDocuments={onOpenDocuments}
            onError={onError}
          />
          <p className={`mt-1 text-[11px] text-slate-400 ${mine ? 'text-right' : ''}`}>{formatTime(message.created_at)}</p>
        </div>
      </li>
    )
  }

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
                {file.download_url ? (
                  <button
                    type="button"
                    onClick={() => openFile(file, onError)}
                    className="truncate text-left font-medium underline-offset-2 hover:underline"
                  >
                    {file.name}
                  </button>
                ) : (
                  <span className="truncate">{file.name}</span>
                )}
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

function ChatThread({
  chat, thread, me, isStaff, onBack, onLoadOlder, onSent, onChatChanged, onLeft, onShowLoan, onOpenDocuments,
}) {
  const [draft, setDraft] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [documentTypes, setDocumentTypes] = useState(null)
  const bottomRef = useRef(null)
  const fileInput = useRef(null)
  const lastId = thread?.messages.at(-1)?.id
  // Files and document requests belong to a loan, so only loan chats have them
  const isLoanChat = chat.kind === 'loan'

  // Follow new messages at the bottom; loading older ones doesn't change the last id.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lastId, chat.id])

  // The document types for the request form, loaded the first time it opens
  useEffect(() => {
    if (!requesting || documentTypes) return
    fetchDocumentTypes()
      .then((data) => setDocumentTypes(data ?? []))
      .catch(() => setDocumentTypes([]))
  }, [requesting, documentTypes])

  async function send() {
    const body = draft.trim()
    if ((!body && !file) || sending) return
    setSending(true)
    setError('')
    try {
      const message = file
        ? await chatApi.sendChatFile(chat.id, { file, body })
        : await chatApi.sendMessage(chat.id, body)
      setDraft('')
      setFile(null)
      onSent(chat.id, message)
    } catch (err) {
      setError(chatApi.chatErrorText(err, file ? 'File not sent' : 'Message not sent'))
    } finally {
      setSending(false)
    }
  }

  // Answer a document request with a file, from its card
  async function uploadForRequest(requestFile, requestId) {
    setError('')
    try {
      onSent(chat.id, await chatApi.sendChatFile(chat.id, { file: requestFile, request: requestId }))
    } catch (err) {
      setError(chatApi.chatErrorText(err, 'File not sent'))
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
        {chat.kind === 'loan' && onOpenDocuments && (
          <button
            type="button"
            onClick={() => onOpenDocuments(chat.loan)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <FileText className="h-3.5 w-3.5" />
            Documents
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
                isStaff={isStaff}
                onUploadForRequest={uploadForRequest}
                onOpenDocuments={onOpenDocuments && (() => onOpenDocuments(chat.loan))}
                onError={setError}
              />
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {requesting && (
        <div className="max-h-[60%] overflow-y-auto border-t border-slate-100 px-5 py-4">
          {documentTypes ? (
            <RequestForm
              loanId={chat.loan}
              types={documentTypes}
              showChatNote={false}
              submit={(payload) => chatApi.requestDocumentInChat(chat.id, payload)}
              onCancel={() => setRequesting(false)}
              onCreated={(message) => {
                setRequesting(false)
                onSent(chat.id, message)
              }}
            />
          ) : (
            <div className="flex justify-center py-4 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="border-t border-slate-100 px-5 py-4"
      >
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
            <span className="shrink-0 text-xs text-slate-400">{formatFileSize(file.size)}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Remove file"
              className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          {isLoanChat && (
            <>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={sending}
                aria-label="Attach a file"
                title="Attach a file"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <HiddenFileInput inputRef={fileInput} onFile={setFile} />
            </>
          )}
          {isLoanChat && isStaff && (
            <button
              type="button"
              onClick={() => setRequesting((v) => !v)}
              aria-label="Request a document"
              title="Request a document"
              className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border ${
                requesting
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <FilePlus2 className="h-4 w-4" />
            </button>
          )}
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
            placeholder={file ? 'Add a message (optional)…' : 'Type a message…'}
            className="max-h-32 min-h-[42px] flex-1 resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || (!draft.trim() && !file)}
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
// onOpenDocuments(loanId): where a loan chat's "Documents" goes (the borrower portal passes its
// Documents page); staff get the loan's Documents tab
export default function ChatPanel({ initialChatId = null, onOpenDocuments }) {
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
  // The loan whose details modal is open, and on which tab (staff, from a loan chat)
  const [openLoanId, setOpenLoanId] = useState(null)
  const [openLoanTab, setOpenLoanTab] = useState('details')
  const openDocuments = isStaff
    ? (loanId) => {
        setOpenLoanTab('documents')
        setOpenLoanId(loanId)
      }
    : onOpenDocuments

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
      prev[chatId]
        ? {
            ...prev,
            [chatId]: {
              ...prev[chatId],
              messages: updateRequestCards(appendMessages(prev[chatId].messages, [message]), message),
            },
          }
        : prev,
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
            onShowLoan={() => {
              setOpenLoanTab('details')
              setOpenLoanId(activeChat.loan)
            }}
            onOpenDocuments={openDocuments}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-400">
            Choose a chat to start messaging.
          </div>
        )}
      </section>

      {isStaff && openLoanId != null && (
        <LoanModal
          key={`${openLoanId}-${openLoanTab}`}
          loanId={openLoanId}
          initialTab={openLoanTab}
          onClose={() => setOpenLoanId(null)}
        />
      )}
    </div>
  )
}
