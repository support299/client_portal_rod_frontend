import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { userAccounts, userRoles, userRoleStyles } from '../../data/adminData'

const emptyForm = { name: '', email: '', phone: '', role: userRoles[0].value }

export default function UsersSection() {
  const [users, setUsers] = useState(userAccounts)
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
          <h2 className="text-base font-semibold text-slate-900">
            {users.length} user{users.length === 1 ? '' : 's'}
          </h2>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'New User'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
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
                placeholder="Jane Doe"
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
                placeholder="jane@flipfunding.com"
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
                placeholder="(555) 000-0000"
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
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Create User
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 sm:px-6">Name</th>
              <th className="px-5 py-3 sm:px-6">Email</th>
              <th className="px-5 py-3 sm:px-6">Role</th>
              <th className="px-5 py-3 sm:px-6">Status</th>
              <th className="px-5 py-3 sm:px-6">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-3.5 font-medium text-slate-900 sm:px-6">{user.name}</td>
                <td className="px-5 py-3.5 text-slate-500 sm:px-6">{user.email}</td>
                <td className="px-5 py-3.5 sm:px-6">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${userRoleStyles[user.role]}`}>
                    {userRoles.find((r) => r.value === user.role)?.label ?? user.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 sm:px-6">{user.status}</td>
                <td className="px-5 py-3.5 text-slate-500 sm:px-6">{user.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
