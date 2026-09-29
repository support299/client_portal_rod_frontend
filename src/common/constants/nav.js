import {
  LayoutGrid,
  Landmark,
  FileText,
  ClipboardList,
  Banknote,
  MessageSquare,
  Calendar,
  DollarSign,
  BookOpen,
  UserPlus,
  Wrench,
  User,
  Settings,
} from 'lucide-react'

export const navSections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'my-loans', label: 'My Loans', icon: Landmark },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'loan-summary', label: 'Loan Summary', icon: ClipboardList },
  { id: 'draw-requests', label: 'Draw Requests', icon: Banknote },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'resources', label: 'Resource Center', icon: BookOpen },
  { id: 'referrals', label: 'Referrals', icon: UserPlus },
  { id: 'tools', label: 'Market Tools', icon: Wrench },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function getSection(id) {
  return navSections.find((s) => s.id === id)
}
