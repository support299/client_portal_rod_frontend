import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { isStaffUser, useAuth } from '../common/auth/AuthContext'
import { checkLoginEmail, forgotPassword } from '../api/auth'
import AuthLayout, { AuthError, authButtonClass, authInputClass } from '../components/AuthLayout'

// Steps: 'email' -> 'password' (has a password) or 'link_sent' (no password yet: set link emailed);
// 'password' -> 'reset_sent' via "Forgot password?"
export default function LoginPage() {
  const { login, isAuthenticated, bootstrapping } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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

  async function run(action) {
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      await action()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEmailSubmit(e) {
    e.preventDefault()
    run(async () => {
      const data = await checkLoginEmail(email.trim())
      setStep(data.next)
    })
  }

  function handlePasswordSubmit(e) {
    e.preventDefault()
    run(async () => {
      const data = await login({ email: email.trim(), password })
      const dest = isStaffUser(data.user) ? '/admin' : from === '/login' ? '/' : from
      navigate(dest, { replace: true })
    })
  }

  function handleForgot() {
    run(async () => {
      await forgotPassword(email.trim())
      setStep('reset_sent')
    })
  }

  function handleResend() {
    run(async () => {
      if (step === 'link_sent') await checkLoginEmail(email.trim())
      else await forgotPassword(email.trim())
      setNotice('Email sent again. It can take a minute to arrive.')
    })
  }

  function backToEmail() {
    setStep('email')
    setPassword('')
    setError('')
    setNotice('')
  }

  if (step === 'link_sent' || step === 'reset_sent') {
    const isNew = step === 'link_sent'
    return (
      <AuthLayout>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {isNew ? (
            <>
              You haven't set a password yet. We've sent a link to{' '}
              <span className="font-medium text-slate-900">{email.trim()}</span> to create one. The link expires in
              72 hours.
            </>
          ) : (
            <>
              We've sent a password reset link to{' '}
              <span className="font-medium text-slate-900">{email.trim()}</span>. The link expires in 2 hours.
            </>
          )}
        </p>

        <div className="mt-6 space-y-3">
          <AuthError>{error}</AuthError>
          {notice ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}
          <p className="text-sm text-slate-500">
            Didn't get it? Check your spam folder or{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={submitting}
              className="font-medium text-emerald-700 hover:underline disabled:opacity-60"
            >
              {submitting ? 'sending…' : 'resend the email'}
            </button>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={backToEmail}
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
      <p className="mt-1 text-sm text-slate-500">Access your deal dashboard.</p>

      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4">
          <AuthError>{error}</AuthError>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              placeholder="you@company.com"
            />
          </div>

          <button type="submit" disabled={submitting} className={authButtonClass}>
            {submitting ? 'Checking…' : 'Continue'}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-4">
          <AuthError>{error}</AuthError>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <span className="truncate text-sm text-slate-900">{email.trim()}</span>
            <button
              type="button"
              onClick={backToEmail}
              className="ml-3 shrink-0 text-sm font-medium text-emerald-700 hover:underline"
            >
              Change
            </button>
          </div>
          {/* Lets password managers pair the saved password with this email */}
          <input type="email" autoComplete="username" value={email.trim()} readOnly hidden />

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgot}
                disabled={submitting}
                className="text-sm font-medium text-emerald-700 hover:underline disabled:opacity-60"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={submitting} className={authButtonClass}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
