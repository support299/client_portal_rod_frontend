import {
  KanbanSquare,
  Landmark,
  StickyNote,
  Building2,
  Users,
  Contact,
  FileStack,
  ListChecks,
  BarChart3,
} from 'lucide-react'

export const adminNavSections = [
  { id: 'tasks', label: 'Tasks', icon: ListChecks, path: '/admin/tasks' },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare, path: '/admin/pipeline' },
  { id: 'loans', label: 'Loans', icon: Landmark, path: '/admin/loans' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { id: 'documentTypes', label: 'Document Types', icon: FileStack, path: '/admin/document-types' },
  { id: 'notes', label: 'Messages', icon: StickyNote, path: '/admin/notes' },
  { id: 'crm', label: 'CRM', icon: Building2, path: '/admin/crm' },
  { id: 'users', label: 'Team', icon: Users, path: '/admin/users' },
  { id: 'borrowers', label: 'Borrowers', icon: Contact, path: '/admin/borrowers' },
]

export const adminSectionSubtitles = {
  pipeline: 'Every active deal, grouped by stage.',
  loans: 'Every loan converted from the pipeline.',
  reports: 'KPIs and CSV exports for the loans in this dashboard.',
  documentTypes: 'The documents you collect from borrowers, and the checklist every new loan gets.',
  tasks: 'Uploads and draw requests on your loans that are waiting for your review.',
  notes: 'Client and internal messages, in one place.',
  crm: 'Sync status and deal data from the CRM.',
  users: 'Manage staff accounts.',
  borrowers: 'Borrower logins created from converted loans.',
}

export function getAdminSection(path) {
  return adminNavSections.find((s) => s.path === path)
}
