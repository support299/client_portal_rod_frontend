import { useCallback, useEffect, useState } from 'react'
import { Pencil, Search, UserPlus, X } from 'lucide-react'
import { userRoleStyles } from '../../common/constants/uiStyles'
import { createUser, fetchUsers, searchCrmUsers, updateUser } from '../../api/admin'

const PAGE_SIZE = 25

const filterSelectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none'

// Values match User.Role on the backend
const userRoles = [
  { value: 'loan_officer', label: 'Loan Officer' },
  { value: 'processor', label: 'Processor' },
  { value: 'closer', label: 'Closer' },
  { value: 'draw_specialist', label: 'Draw Specialist' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'admin', label: 'Admin' },
]

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: userRoles[0].value,
  password: '',
  is_active: true,
}

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

function crmUserToForm(crmUser) {
  const [first = '', ...rest] = (crmUser.name ?? '').trim().split(/\s+/)
  return {
    first_name: crmUser.first_name || first,
    last_name: crmUser.last_name || rest.join(' '),
    email: crmUser.email ?? '',
    phone: crmUser.phone ?? '',
  }
}

function CrmUserPicker({ selected, onSelect, onClear }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const search = query.trim()
    if (!search) {
      setResults([])
      setError('')
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchCrmUsers(search)
        if (!cancelled) {
          setResults(data?.results ?? data ?? [])
          setError('')
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{selected.name || selected.email}</p>
          <p className="truncate text-xs text-slate-500">{selected.email}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear CRM user"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-emerald-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search CRM users by name, email or phone"
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none"
        />
      </div>
      {query.trim() && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading && <li className="px-3 py-2 text-sm text-slate-400">Searching…</li>}
          {!loading && error && <li className="px-3 py-2 text-sm text-red-600">{error}</li>}
          {!loading && !error && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">No CRM users found.</li>
          )}
          {!loading &&
            !error &&
            results.map((crmUser) => (
              <li key={crmUser.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(crmUser)
                    setQuery('')
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-900">{crmUser.name || '—'}</p>
                  <p className="text-xs text-slate-500">
                    {crmUser.email || 'No email'}
                    {crmUser.phone ? ` · ${crmUser.phone}` : ''}
                  </p>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

export default function UsersSection() {
  const [users, setUsers] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [crmUser, setCrmUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const isEditing = editingId !== null
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  // Debounce the search box; a new search starts from the first page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const data = await fetchUsers({
        staff: 'true', // borrowers have their own section
        search,
        role: roleFilter,
        is_active: activeFilter,
        page,
        page_size: PAGE_SIZE,
      })
      setUsers(data?.results ?? [])
      setCount(data?.count ?? 0)
    } catch (err) {
      setListError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, activeFilter, page])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setCrmUser(null)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(user) {
    setEditingId(user.id)
    setForm({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      role: user.role,
      password: '',
      is_active: user.is_active ?? true,
    })
    setCrmUser(null)
    setFormError('')
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return
    setShowForm(false)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSelectCrmUser(selected) {
    setCrmUser(selected)
    setForm((f) => ({ ...f, ...crmUserToForm(selected) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email.trim()) return

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      is_active: form.is_active,
    }
    // Password is required on create and only sent on edit when changed
    if (form.password) payload.password = form.password

    setSaving(true)
    setFormError('')
    try {
      if (isEditing) {
        const saved = await updateUser(editingId, payload)
        setUsers((list) => list.map((u) => (u.id === saved.id ? saved : u)))
      } else {
        await createUser(payload)
        loadUsers()
      }
      setShowForm(false)
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Team Accounts</h2>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>

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
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by role"
            className={filterSelectClass}
          >
            <option value="">All roles</option>
            {userRoles.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by status"
            className={filterSelectClass}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {listError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{listError}</p>
        )}

        {loading && users.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            {search || roleFilter || activeFilter ? 'No users match these filters.' : 'No user accounts yet.'}
          </p>
        ) : (
          <ul className={`mt-4 divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user.full_name || user.email}</p>
                  <p className="text-xs text-slate-400">
                    {user.email} &middot; {user.phone || 'No phone'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${userRoleStyles[user.role] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {user.role_label ?? userRoles.find((r) => r.value === user.role)?.label ?? user.role}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEdit(user)}
                    aria-label={`Edit ${user.full_name || user.email}`}
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
              {count} user{count === 1 ? '' : 's'} &middot; Page {page} of {pageCount}
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
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={closeForm}
        >
          <div
            className="max-h-full w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">{isEditing ? 'Edit User' : 'Add User'}</h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {!isEditing && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Choose CRM User</p>
                  <div className="mt-1">
                    <CrmUserPicker
                      selected={crmUser}
                      onSelect={handleSelectCrmUser}
                      onClear={() => setCrmUser(null)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Fills in the details below. You can still edit them.</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="text-xs font-medium text-slate-500">First Name</label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="text-xs font-medium text-slate-500">Last Name</label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="text-xs font-medium text-slate-500">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="phone" className="text-xs font-medium text-slate-500">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="role" className="text-xs font-medium text-slate-500">Role</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`${inputClass} bg-white`}
                >
                  {userRoles.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="password" className="text-xs font-medium text-slate-500">
                  {isEditing ? 'New Password' : 'Password'}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required={!isEditing}
                  value={form.password}
                  onChange={handleChange}
                  placeholder={isEditing ? 'Leave blank to keep current password' : ''}
                  className={inputClass}
                />
              </div>
              {isEditing && (
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
              )}

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
