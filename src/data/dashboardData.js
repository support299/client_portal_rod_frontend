export const properties = [
  {
    id: 1,
    address: '123 Main Street',
    status: 'Processing',
    loanAmount: '$450,000',
    rateLock: '6.25%',
    nextPaymentDate: 'Sep 1, 2026',
    totalDue: '$2,812.50',
    estimatedEndDate: 'Feb 15, 2027',
  },
  {
    id: 2,
    address: '456 Oak Drive',
    status: 'Funded',
    loanAmount: '$610,000',
    rateLock: '7.10%',
    nextPaymentDate: 'Aug 20, 2026',
    totalDue: '$3,609.17',
    estimatedEndDate: 'May 30, 2027',
  },
  {
    id: 3,
    address: '789 Maple Ave',
    status: 'Underwriting',
    loanAmount: '$325,000',
    rateLock: '6.75%',
    nextPaymentDate: '—',
    totalDue: '—',
    estimatedEndDate: 'Dec 1, 2026',
  },
]

export const loanStatusStyles = {
  Processing: 'bg-blue-100 text-blue-700',
  Funded: 'bg-emerald-100 text-emerald-700',
  Underwriting: 'bg-amber-100 text-amber-800',
}

export const loanStages = [
  { key: 'application', label: 'Application', state: 'complete' },
  { key: 'underwriting', label: 'Underwriting', state: 'current' },
  { key: 'approval', label: 'Approval', state: 'upcoming' },
  { key: 'closing', label: 'Closing', state: 'locked' },
]

export const currentStatus = {
  label: 'Underwriting',
  badge: 'Action Needed',
}

export const urgentAction = {
  title: 'Upload Proof of Insurance',
  subtitle: 'Blocking Underwriting',
}

export const assignedOfficer = {
  name: 'Sarah Jenkins',
  title: 'Senior Loan Officer',
  avatar:
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces',
}

export const recentActivity = [
  { id: 1, title: 'Appraisal Received', time: 'Today, 10:30 AM', done: true },
  { id: 2, title: 'Title Search Initiated', time: 'Yesterday, 2:15 PM', done: false },
  { id: 3, title: 'Application Submitted', time: 'Oct 12, 9:00 AM', done: false },
]

export const user = {
  name: 'Alex',
  avatar:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  notificationCount: 3,
}

export const documentsList = [
  { id: 1, name: 'Proof of Insurance', status: 'Missing', updated: '—' },
  { id: 2, name: 'Purchase Agreement', status: 'Approved', updated: 'Oct 12, 2025' },
  { id: 3, name: 'Appraisal Report', status: 'Approved', updated: 'Aug 11, 2026' },
  { id: 4, name: 'Title Search', status: 'In Review', updated: 'Aug 10, 2026' },
  { id: 5, name: 'Rehab Budget', status: 'Approved', updated: 'Oct 14, 2025' },
]

export const loanTerms = [
  { label: 'Loan Amount', value: '$450,000' },
  { label: 'Interest Rate', value: '6.25% (locked)' },
  { label: 'Loan Term', value: '12 months' },
  { label: 'Origination Fee', value: '2.0 points' },
  { label: 'Estimated Closing Date', value: 'Sep 5, 2026' },
  { label: 'Property Address', value: '123 Main St' },
]

export const messageThread = [
  {
    id: 1,
    from: 'officer',
    text: 'Hi Alex, just following up — we still need proof of insurance to move forward with underwriting.',
    time: 'Yesterday, 4:12 PM',
  },
  {
    id: 2,
    from: 'user',
    text: 'Got it, working on it with my insurance agent now.',
    time: 'Yesterday, 4:45 PM',
  },
  {
    id: 3,
    from: 'officer',
    text: 'Sounds good! The appraisal came back today, so we are on track once that document is in.',
    time: 'Today, 10:32 AM',
  },
]

export const upcomingEvents = [
  { id: 1, title: 'Insurance Document Deadline', date: 'Aug 14, 2026', time: '5:00 PM' },
  { id: 2, title: 'Underwriting Check-in Call', date: 'Aug 18, 2026', time: '11:00 AM' },
  { id: 3, title: 'Estimated Closing', date: 'Sep 5, 2026', time: 'All day' },
]

export const dealTimeline = [
  { id: 1, date: 'Jul 18, 2026', title: 'Loan #1187: Application Submitted' },
  { id: 2, date: 'Jul 19, 2026', title: 'Loan #1187: Initial Review Complete' },
  { id: 3, date: 'Jul 20, 2026', title: 'Loan #1187: Processing Started' },
  { id: 4, date: 'Jul 21, 2026', title: 'Loan #1187: Bank Statements Received' },
  { id: 5, date: 'Jul 22, 2026', title: 'Loan #1187: Appraisal Ordered' },
  { id: 6, date: 'Jul 25, 2026', title: 'Loan #1187: Conditional Approval', current: true },
]
