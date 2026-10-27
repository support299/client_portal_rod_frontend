import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LinkIcon } from 'lucide-react'
import { isStaffUser, useAuth } from '../common/auth/AuthContext'
import { checkPasswordLink, setPasswordFromLink } from '../api/auth'
import AuthLayout, { AuthError, authButtonClass, authInputClass } from '../components/AuthLayout'

// Opened from the emailed link: /set-password?token=...
export default function SetPasswordPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  // null while checking, false if invalid/expired, else { purpose, email }
  const [link, setLink] = useState(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setLink(false)
      return
    }
    let cancelled = false
    checkPasswordLink(token)
      .then((data) => !cancelled && setLink(data))
      .catch(() => !cancelled && setLink(false))
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setSubmitting(true)
    try {
      await setPasswordFromLink({ token, password })
    } catch (err) {
      if (err.data?.token) setLink(false)
      else setError(err.message || 'Unable to set the password')
      setSubmitting(false)
      return
    }
    // Password saved: sign straight in
    try {
      const data = await login({ email: link.email, password })
      navigate(isStaffUser(data.user) ? '/admin' : '/', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  if (link === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Checking your link…
      </div>
    )
  }

  if (link === false) {
    return (
      <AuthLayout>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <LinkIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">This link has expired</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          The link was already used, has expired, or a newer one was sent. Go back to sign in and enter your email
          to get a new link.
        </p>
        <Link to="/login" className={`mt-8 ${authButtonClass}`}>
          Back to sign in
        </Link>
      </AuthLayout>
    )
  }

  const isNew = link.purpose === 'set'

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-slate-900">{isNew ? 'Create your password' : 'Reset your password'}</h2>
      <p className="mt-1 text-sm text-slate-500">
        For <span className="font-medium text-slate-900">{link.email}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <AuthError>{error}</AuthError>

        {/* Lets password managers save the new password against this email */}
        <input type="email" autoComplete="username" value={link.email} readOnly hidden />

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={authInputClass}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? 'Saving…' : isNew ? 'Create password & sign in' : 'Reset password & sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
