import { useMemo, useRef, useState } from 'react'
import { Search, ShieldCheck, Lock, Paperclip, FileText, ChevronDown, File } from 'lucide-react'
import {
  internalNotesByLoan,
  messagesByBorrower,
  commonDocumentRequests,
  pipelineLoans,
  staffUser,
} from '../../data/adminData'

const borrowers = [...new Set(pipelineLoans.map((l) => l.borrower))]
const emptyThread = { unread: false, updatedAt: Infinity, messages: [] }

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function LoanNotes({ loanNumber, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes)
  const [draft, setDraft] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    setNotes((prev) => [
      {
        id: prev.length + 1,
        author: staffUser.name,
        avatar: staffUser.avatar,
        timestamp: 'Just now',
        note: draft.trim(),
      },
      ...prev,
    ])
    setDraft('')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{loanNumber}</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          <Lock className="h-3 w-3" />
          Staff only
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-start gap-2">
        <img src={staffUser.avatar} alt="" className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add an internal note..."
            className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Post
          </button>
        </div>
      </form>

      <ul className="mt-5 space-y-4 border-t border-slate-100 pt-4">
        {notes.map((note) => (
          <li key={note.id} className="flex items-start gap-3">
            <img src={note.avatar} alt="" className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{note.author}</p>
                <p className="text-xs text-slate-400">{note.timestamp}</p>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">{note.note}</p>
            </div>
          </li>
        ))}
        {notes.length === 0 && <p className="text-sm text-slate-400">No internal notes yet.</p>}
      </ul>
    </div>
  )
}

function MessageBubble({ message }) {
  const isStaff = message.sender === 'staff'
  const bubbleClasses = isStaff ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
  const metaClasses = isStaff ? 'text-emerald-100' : 'text-slate-400'

  return (
    <li className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${bubbleClasses}`}>
        {message.type === 'doc_request' ? (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Requested: {message.document}</p>
              <p className={`text-[11px] ${metaClasses}`}>Awaiting upload</p>
            </div>
          </div>
        ) : message.type === 'attachment' ? (
          <div className="flex items-center gap-2">
            <File className="h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{message.fileName}</p>
              <p className={`text-[11px] ${metaClasses}`}>{message.fileSize}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm">{message.text}</p>
        )}
        <p className={`mt-1 text-[11px] ${metaClasses}`}>
          {message.author} &middot; {message.timestamp}
        </p>
      </div>
    </li>
  )
}

function messagePreview(message) {
  if (!message) return 'No messages yet'
  if (message.type === 'doc_request') return `📄 Requested: ${message.document}`
  if (message.type === 'attachment') return `📎 ${message.fileName}`
  return message.text
}

function BorrowerMessages() {
  const [threads, setThreads] = useState(messagesByBorrower)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [showDocMenu, setShowDocMenu] = useState(false)
  const fileInputRef = useRef(null)

  const sortedBorrowers = useMemo(
    () =>
      [...borrowers].sort((a, b) => {
        const aTime = (threads[a] ?? emptyThread).updatedAt
        const bTime = (threads[b] ?? emptyThread).updatedAt
        if (aTime !== bTime) return aTime - bTime
        return a.localeCompare(b)
      }),
    [threads],
  )

  const activeName = selected ?? sortedBorrowers[0]
  const officer = pipelineLoans.find((l) => l.borrower === activeName)?.officer
  const activeThread = threads[activeName] ?? emptyThread

  const filteredBorrowers = useMemo(
    () => sortedBorrowers.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase())),
    [sortedBorrowers, query],
  )

  function selectBorrower(name) {
    setSelected(name)
    setShowDocMenu(false)
    setThreads((prev) => {
      const current = prev[name] ?? emptyThread
      if (!current.unread) return prev
      return { ...prev, [name]: { ...current, unread: false } }
    })
  }

  function appendMessage(message) {
    setThreads((prev) => {
      const current = prev[activeName] ?? emptyThread
      return {
        ...prev,
        [activeName]: {
          unread: false,
          updatedAt: 0,
          messages: [...current.messages, { id: current.messages.length + 1, ...message }],
        },
      }
    })
  }

  function handleSend(e) {
    e.preventDefault()
    if (!draft.trim()) return
    appendMessage({
      type: 'text',
      sender: 'staff',
      author: staffUser.name,
      timestamp: 'Just now',
      text: draft.trim(),
    })
    setDraft('')
  }

  function handleRequestDocument(document) {
    appendMessage({
      type: 'doc_request',
      sender: 'staff',
      author: staffUser.name,
      timestamp: 'Just now',
      document,
    })
    setShowDocMenu(false)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    appendMessage({
      type: 'attachment',
      sender: 'staff',
      author: staffUser.name,
      timestamp: 'Just now',
      fileName: file.name,
      fileSize: formatFileSize(file.size),
    })
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="w-full shrink-0 rounded-xl border border-slate-200 bg-white lg:w-72">
        <div className="border-b border-slate-100 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>
        <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto lg:max-h-[32rem]">
          {filteredBorrowers.map((name) => {
            const t = threads[name] ?? emptyThread
            const lastMessage = t.messages[t.messages.length - 1]
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => selectBorrower(name)}
                  className={`flex w-full items-start gap-2 px-4 py-3 text-left transition-colors ${
                    activeName === name ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.unread ? 'bg-emerald-600' : 'bg-transparent'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        activeName === name ? 'text-emerald-800' : 'text-slate-900'
                      } ${t.unread ? 'font-bold' : 'font-semibold'}`}
                    >
                      {name}
                    </p>
                    <p className={`mt-0.5 truncate text-xs ${t.unread ? 'font-semibold text-slate-600' : 'text-slate-400'}`}>
                      {messagePreview(lastMessage)}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
          {filteredBorrowers.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">No clients match.</li>
          )}
        </ul>
      </div>

      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">{activeName}</h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Visible to {officer ?? 'assigned officer'} and Admin
          </div>
        </div>

        <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {activeThread.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {activeThread.messages.length === 0 && (
            <li className="py-6 text-center text-sm text-slate-400">No messages yet.</li>
          )}
        </ul>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="relative mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDocMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <FileText className="h-3.5 w-3.5" />
              Request Document
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach File
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

            {showDocMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
                {commonDocumentRequests.map((doc) => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => handleRequestDocument(doc)}
                    className="block w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {doc}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${activeName}...`}
              className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NotesSection() {
  const [tab, setTab] = useState('messages')

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('messages')}
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
            tab === 'messages' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Message Borrower
        </button>
        <button
          type="button"
          onClick={() => setTab('internal')}
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
            tab === 'internal' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Internal Notes
        </button>
      </div>

      {tab === 'messages' ? (
        <BorrowerMessages />
      ) : (
        <div className="space-y-6">
          {Object.entries(internalNotesByLoan).map(([loanNumber, notes]) => (
            <LoanNotes key={loanNumber} loanNumber={loanNumber} initialNotes={notes} />
          ))}
        </div>
      )}
    </div>
  )
}
