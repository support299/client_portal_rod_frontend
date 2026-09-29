import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { userRoleStyles } from '../../common/constants/uiStyles'

const userRoles = [
  { value: 'BORROWER', label: 'Borrower' },
  { value: 'LOAN_OFFICER', label: 'Loan Officer' },
  { value: 'PROCESSOR', label: 'Processor' },
  { value: 'CLOSER', label: 'Closer' },
  { value: 'DRAW_SPECIALIST', label: 'Draw Specialist' },
  { value: 'ADMIN', label: 'Admin' },
]

const emptyForm = { name: '', email: '', phone: '', role: userRoles[0].value }

export default function UsersSection() {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return

    setUsers((list) => [
      ...list,
      {
        id: list.length ? Math.max(...list.map((u) => u.id)) + 1 : 1,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        status: 'Active',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      },
    ])
    setForm(emptyForm)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Team &amp; Borrower Accounts</h2>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {users.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No user accounts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-400">
                    {user.email} &middot; {user.phone || 'No phone'} &middot; Added {user.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${userRoleStyles[user.role] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {userRoles.find((r) => r.value === user.role)?.label ?? user.role}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {user.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Add User</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="name" className="text-xs font-medium text-slate-500">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                />
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
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
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
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="role" className="text-xs font-medium text-slate-500">Role</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                >
                  {userRoles.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
