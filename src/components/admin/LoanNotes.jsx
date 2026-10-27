import { useCallback, useEffect, useState } from 'react'
import { Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { createNote, deleteNote, fetchNotes, updateNote } from '../../api/notes'
import { errorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none'
const iconButton =
  'flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50'
const primaryButton =
  'inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60'
const cancelButton = 'rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100'

function NewNoteForm({ loanId, onCreated }) {
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    setError('')
    try {
      await createNote(loanId, { body: body.trim() })
      setBody('')
      await onCreated()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="new-loan-note" className="sr-only">New note</label>
      <textarea
        id="new-loan-note"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add an internal note…"
        className={inputClass}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400">Visible to admins and the loan team only.</p>
        <button type="submit" disabled={saving || !body.trim()} className={primaryButton}>
          {saving ? 'Adding…' : 'Add note'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}

function NoteCard({ loanId, note, onChanged, onError }) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(note.body)
  const [busy, setBusy] = useState(false)

  async function run(action) {
    setBusy(true)
    onError('')
    try {
      await action()
      await onChanged()
      return true
    } catch (err) {
      onError(errorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function save(e) {
    e.preventDefault()
    if (!body.trim()) return
    if (await run(() => updateNote(loanId, note.id, { body: body.trim() }))) setEditing(false)
  }

  const edited = note.updated_at && new Date(note.updated_at) - new Date(note.created_at) > 1000

  return (
    <li className={`rounded-lg border p-3 ${note.is_pinned ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{note.author?.full_name || 'Former user'}</span>
          {' · '}
          {formatDate(note.created_at, true)}
          {edited && <span className="text-slate-400"> · edited</span>}
        </p>
        {note.can_edit && !editing && (
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => updateNote(loanId, note.id, { is_pinned: !note.is_pinned }))}
              aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
              title={note.is_pinned ? 'Unpin' : 'Pin'}
              className={iconButton}
            >
              {note.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setBody(note.body)
                setEditing(true)
              }}
              aria-label="Edit note"
              title="Edit"
              className={iconButton}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => window.confirm('Delete this note?') && run(() => deleteNote(loanId, note.id))}
              aria-label="Delete note"
              title="Delete"
              className={`${iconButton} hover:text-red-600`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-2 space-y-2">
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} className={inputClass} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className={cancelButton}>Cancel</button>
            <button type="submit" disabled={busy || !body.trim()} className={primaryButton}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-800">
          {note.is_pinned && <Pin className="mr-1 inline h-3.5 w-3.5 text-amber-600" />}
          {note.body}
        </p>
      )}
    </li>
  )
}

/** A loan's internal notes for staff: add, pin, edit and delete. Pinned notes come first. */
export default function LoanNotes({ loanId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const list = await fetchNotes(loanId)
      setNotes(list ?? [])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [loanId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <NewNoteForm loanId={loanId} onCreated={load} />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          <button type="button" onClick={() => setError('')} className="font-semibold underline">Dismiss</button>
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate-400">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <NoteCard key={note.id} loanId={loanId} note={note} onChanged={load} onError={setError} />
          ))}
        </ul>
      )}
    </div>
  )
}
