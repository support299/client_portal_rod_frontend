import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children, staffOnly = false, borrowerOnly = false }) {
  const { isAuthenticated, isStaff, bootstrapping } = useAuth()
  const location = useLocation()

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/" replace />
  }

  if (borrowerOnly && isStaff) {
    return <Navigate to="/admin" replace />
  }

  return children
}
