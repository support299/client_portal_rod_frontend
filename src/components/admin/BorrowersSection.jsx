import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Search, X } from 'lucide-react'
import { fetchUsers, updateUser } from '../../api/admin'

const PAGE_SIZE = 25

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none'

// DRF returns { field: [messages] }; show the first one with its field name
function errorMessage(err) {
  const data = err?.data
  if (data && typeof data === 'object' && !data.detail) {
    const [field, messages] = Object.entries(data)[0] ?? []
    const message = Array.isArray(messages) ? messages[0] : messages
    if (message) return field === 'non_field_errors' ? message : `${field.replace(/_/g, ' ')}: ${message}`
  }
  return err?.message || 'Request failed'
}

// Borrowers are created by converting opportunities, so this only edits them; role is never sent
function EditBorrowerModal({ borrower, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: borrower.first_name ?? '',
    last_name: borrower.last_name ?? '',
    email: borrower.email ?? '',
    phone: borrower.phone ?? '',
    password: '',
    is_active: borrower.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && !saving && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email.trim()) return

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      is_active: form.is_active,
    }
    if (form.password) payload.password = form.password

    setSaving(true)
    setError('')
    try {
      // The update response has no loan_count, so keep the one from the list
      const saved = await updateUser(borrower.id, payload)
      onSaved({ ...saved, loan_count: borrower.loan_count })
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit borrower"
        className="max-h-full w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Edit Borrower</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="borrower-first" className="text-xs font-medium text-slate-500">First Name</label>
              <input
                id="borrower-first"
                name="first_name"
                type="text"
                value={form.first_name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="borrower-last" className="text-xs font-medium text-slate-500">Last Name</label>
              <input
                id="borrower-last"
                name="last_name"
                type="text"
                value={form.last_name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="borrower-email" className="text-xs font-medium text-slate-500">Email</label>
            <input
              id="borrower-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="borrower-phone" className="text-xs font-medium text-slate-500">Phone</label>
            <input
              id="borrower-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="borrower-password" className="text-xs font-medium text-slate-500">New Password</label>
            <input
              id="borrower-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              Borrowers created from a loan have no password until one is set here.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Active
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BorrowersSection() {
  const [borrowers, setBorrowers] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  // Debounce the search box; a new search starts from the first page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchUsers({ staff: 'false', search, is_active: activeFilter, page, page_size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        setBorrowers(data?.results ?? [])
        setCount(data?.count ?? 0)
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [search, activeFilter, page])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Borrower Accounts</h2>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or phone"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by status"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading && borrowers.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Loading borrowers…</p>
      ) : borrowers.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {search || activeFilter
            ? 'No borrowers match these filters.'
            : 'No borrowers yet. They are created when an opportunity is converted to a loan.'}
        </p>
      ) : (
        <ul className={`mt-4 divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
          {borrowers.map((borrower) => (
            <li key={borrower.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{borrower.full_name?.trim() || borrower.email}</p>
                <p className="text-xs text-slate-400">
                  {borrower.email} &middot; {borrower.phone || 'No phone'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {borrower.loan_count > 0 ? (
                  <Link
                    to={`/admin/loans?search=${encodeURIComponent(borrower.email)}`}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {borrower.loan_count} loan{borrower.loan_count === 1 ? '' : 's'}
                  </Link>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-400">No loans</span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    borrower.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {borrower.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(borrower)}
                  aria-label={`Edit ${borrower.full_name?.trim() || borrower.email}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {count > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>
            {count} borrower{count === 1 ? '' : 's'} &middot; Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount || loading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editing && (
        <EditBorrowerModal
          borrower={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setBorrowers((list) => list.map((b) => (b.id === saved.id ? saved : b)))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
