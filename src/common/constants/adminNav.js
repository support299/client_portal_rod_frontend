import {
  LayoutGrid,
  KanbanSquare,
  Landmark,
  CheckSquare,
  StickyNote,
  Building2,
  MessagesSquare,
  Users,
  Contact,
  FileStack,
} from 'lucide-react'

export const adminNavSections = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, path: '/admin' },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare, path: '/admin/pipeline' },
  { id: 'loans', label: 'Loans', icon: Landmark, path: '/admin/loans' },
  { id: 'documentTypes', label: 'Document Types', icon: FileStack, path: '/admin/document-types' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/admin/tasks' },
  { id: 'notes', label: 'Messages', icon: StickyNote, path: '/admin/notes' },
  { id: 'crm', label: 'CRM', icon: Building2, path: '/admin/crm' },
  { id: 'communications', label: 'Email & SMS', icon: MessagesSquare, path: '/admin/communications' },
  { id: 'users', label: 'Team', icon: Users, path: '/admin/users' },
  { id: 'borrowers', label: 'Borrowers', icon: Contact, path: '/admin/borrowers' },
]

export const adminSectionSubtitles = {
  overview: 'Everything on your plate, at a glance.',
  pipeline: 'Every active deal, grouped by stage.',
  loans: 'Every loan converted from the pipeline.',
  documentTypes: 'The documents you collect from borrowers, and the checklist every new loan gets.',
  tasks: 'Work assigned across the team.',
  notes: 'Client and internal messages, in one place.',
  crm: 'Sync status and deal data from the CRM.',
  communications: 'Every email and text, in one place.',
  users: 'Manage staff accounts.',
  borrowers: 'Borrower logins created from converted loans.',
}

export function getAdminSection(path) {
  return adminNavSections.find((s) => s.path === path)
}
