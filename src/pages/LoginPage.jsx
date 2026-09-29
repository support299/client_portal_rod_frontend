import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Landmark } from 'lucide-react'
import { useAuth } from '../common/auth/AuthContext'

export default function LoginPage() {
  const { login, isAuthenticated, bootstrapping } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await login({ email: email.trim(), password })
      const dest = data.user?.role === 'staff' ? '/admin' : from === '/login' ? '/' : from
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-700/40 via-slate-900 to-slate-950" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">Flip Funding</p>
            <p className="text-xs text-slate-400">Investor Client Portal</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Track every deal from application to funding.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            See where your loan stands, what documents are missing, and what to do next — in one place.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">Private lending for investors.</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Flip Funding</p>
              <p className="text-xs text-slate-400">Client Portal</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Access your deal dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-emerald-600/30 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-emerald-600/30 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New investor?{' '}
            <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
