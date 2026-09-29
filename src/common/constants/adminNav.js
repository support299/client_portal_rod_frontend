import {
  LayoutGrid,
  KanbanSquare,
  CheckSquare,
  FileWarning,
  Milestone,
  StickyNote,
  Building2,
  MessagesSquare,
  Users,
} from 'lucide-react'

export const adminNavSections = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, path: '/admin' },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare, path: '/admin/pipeline' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/admin/tasks' },
  { id: 'documents', label: 'Documents', icon: FileWarning, path: '/admin/documents' },
  { id: 'milestones', label: 'Milestones', icon: Milestone, path: '/admin/milestones' },
  { id: 'notes', label: 'Messages', icon: StickyNote, path: '/admin/notes' },
  { id: 'crm', label: 'CRM', icon: Building2, path: '/admin/crm' },
  { id: 'communications', label: 'Email & SMS', icon: MessagesSquare, path: '/admin/communications' },
  { id: 'users', label: 'Team', icon: Users, path: '/admin/users' },
]

export const adminSectionSubtitles = {
  overview: 'Everything on your plate, at a glance.',
  pipeline: 'Every active deal, grouped by stage.',
  tasks: 'Work assigned across the team.',
  documents: 'What borrowers still owe, and what just came in.',
  milestones: 'Track and update where each loan stands.',
  notes: 'Client and internal messages, in one place.',
  crm: 'Sync status and deal data from the CRM.',
  communications: 'Every email and text, in one place.',
  users: 'Manage staff and borrower accounts.',
}

export function getAdminSection(path) {
  return adminNavSections.find((s) => s.path === path)
}
