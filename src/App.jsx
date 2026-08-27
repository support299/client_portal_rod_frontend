import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<AdminLayout />}>
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
