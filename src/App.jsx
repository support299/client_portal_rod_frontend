import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './common/auth/AuthContext'
import ProtectedRoute from './common/auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import AdminLayout from './pages/AdminLayout'
import AdminOverview from './components/admin/AdminOverview'
import PipelineSection from './components/admin/PipelineSection'
import TasksSection from './components/admin/TasksSection'
import LoanDetailSection from './components/admin/LoanDetailSection'
import DocumentsSection from './components/admin/DocumentsSection'
import MilestonesSection from './components/admin/MilestonesSection'
import NotesSection from './components/admin/NotesSection'
import CrmSection from './components/admin/CrmSection'
import CommunicationsSection from './components/admin/CommunicationsSection'
import UsersSection from './components/admin/UsersSection'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute borrowerOnly>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute staffOnly>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="pipeline" element={<PipelineSection />} />
            <Route path="tasks" element={<TasksSection />} />
            <Route path="loans/:loanNumber" element={<LoanDetailSection />} />
            <Route path="documents" element={<DocumentsSection />} />
            <Route path="milestones" element={<MilestonesSection />} />
            <Route path="notes" element={<NotesSection />} />
            <Route path="crm" element={<CrmSection />} />
            <Route path="communications" element={<CommunicationsSection />} />
            <Route path="users" element={<UsersSection />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
