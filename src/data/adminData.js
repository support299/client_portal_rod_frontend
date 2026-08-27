import { teamMembers, drawRequestStages } from './dashboardData'

export { drawRequestStages }

export const staffUser = {
  name: 'Sarah Jenkins',
  role: 'Senior Loan Officer',
  avatar: teamMembers[0].avatar,
  notificationCount: 5,
}

export const staffDirectory = teamMembers

export const userRoles = [
  { value: 'BORROWER', label: 'Borrower' },
  { value: 'LOAN_OFFICER', label: 'Loan Officer' },
  { value: 'PROCESSOR', label: 'Processor' },
  { value: 'CLOSER', label: 'Closer' },
  { value: 'DRAW_SPECIALIST', label: 'Draw Specialist' },
  { value: 'ADMIN', label: 'Admin' },
]

export const userRoleStyles = {
  BORROWER: 'bg-slate-100 text-slate-600',
  LOAN_OFFICER: 'bg-emerald-100 text-emerald-700',
  PROCESSOR: 'bg-blue-100 text-blue-700',
  CLOSER: 'bg-purple-100 text-purple-700',
  DRAW_SPECIALIST: 'bg-amber-100 text-amber-800',
  ADMIN: 'bg-red-100 text-red-700',
}

export const userAccounts = [
  { id: 1, name: 'Sarah Jenkins', email: 'sarah.jenkins@flipfunding.com', phone: '(555) 210-8842', role: 'LOAN_OFFICER', status: 'Active', createdAt: 'Jan 8, 2026' },
  { id: 2, name: 'Marcus Webb', email: 'marcus.webb@flipfunding.com', phone: '(555) 347-2210', role: 'PROCESSOR', status: 'Active', createdAt: 'Jan 8, 2026' },
  { id: 3, name: 'Priya Nair', email: 'priya.nair@flipfunding.com', phone: '(555) 481-9034', role: 'CLOSER', status: 'Active', createdAt: 'Jan 8, 2026' },
  { id: 4, name: 'Devon Ellis', email: 'devon.ellis@flipfunding.com', phone: '(555) 662-1187', role: 'DRAW_SPECIALIST', status: 'Active', createdAt: 'Jan 8, 2026' },
  { id: 5, name: 'Alex Rivera', email: 'alex.rivera@example.com', phone: '(555) 902-4471', role: 'BORROWER', status: 'Active', createdAt: 'Feb 2, 2026' },
]

export const pipelineStages = [
  { key: 'new', label: 'New Application' },
  { key: 'processing', label: 'Processing' },
  { key: 'underwriting', label: 'Underwriting' },
  { key: 'approved', label: 'Approved' },
  { key: 'closing', label: 'Closing' },
  { key: 'funded', label: 'Funded' },
]

export const dealHealthConfig = {
  'On Track': { classes: 'bg-emerald-100 text-emerald-700', icon: 'CircleCheck' },
  'Needs Attention': { classes: 'bg-amber-100 text-amber-800', icon: 'AlertTriangle' },
  'Waiting on You': { classes: 'bg-red-100 text-red-700', icon: 'UserRoundCheck' },
}

export const pipelineLoans = [
  { id: 101, loanNumber: '#1187', borrower: 'Alex Rivera', address: '123 Main Street', stage: 'underwriting', amount: '$450,000', officer: 'Sarah Jenkins', daysInStage: 6, health: 'Waiting on You' },
  { id: 102, loanNumber: '#2304', borrower: 'Alex Rivera', address: '456 Oak Drive', stage: 'funded', amount: '$610,000', officer: 'Sarah Jenkins', daysInStage: 45, health: 'On Track' },
  { id: 103, loanNumber: '#3092', borrower: 'Alex Rivera', address: '789 Maple Ave', stage: 'processing', amount: '$325,000', officer: 'Sarah Jenkins', daysInStage: 3, health: 'Needs Attention' },
  { id: 104, loanNumber: '#4410', borrower: 'Monica Diaz', address: '212 Birchwood Ln', stage: 'new', amount: '$275,000', officer: 'Marcus Webb', daysInStage: 1, health: 'On Track' },
  { id: 105, loanNumber: '#4521', borrower: 'Dante Osei', address: '88 Fieldstone Ct', stage: 'processing', amount: '$540,000', officer: 'Marcus Webb', daysInStage: 8, health: 'Needs Attention' },
  { id: 106, loanNumber: '#4633', borrower: 'Grace Whitfield', address: '17 Summit Ridge Rd', stage: 'underwriting', amount: '$390,000', officer: 'Priya Nair', daysInStage: 12, health: 'Waiting on You' },
  { id: 107, loanNumber: '#4702', borrower: 'Omar Haddad', address: '350 Lakeshore Dr', stage: 'approved', amount: '$725,000', officer: 'Priya Nair', daysInStage: 2, health: 'On Track' },
  { id: 108, loanNumber: '#4788', borrower: 'Jenna Park', address: '9 Cobblestone Way', stage: 'closing', amount: '$465,000', officer: 'Sarah Jenkins', daysInStage: 4, health: 'On Track' },
  { id: 109, loanNumber: '#4810', borrower: 'Leo Bianchi', address: '61 Harborview Ave', stage: 'new', amount: '$310,000', officer: 'Marcus Webb', daysInStage: 0, health: 'On Track' },
  { id: 110, loanNumber: '#4823', borrower: 'Tasha Reynolds', address: '154 Pinecrest Blvd', stage: 'closing', amount: '$580,000', officer: 'Priya Nair', daysInStage: 7, health: 'Needs Attention' },
  { id: 111, loanNumber: '#4890', borrower: 'Wes Coulter', address: '27 Riverbend Ter', stage: 'funded', amount: '$412,000', officer: 'Sarah Jenkins', daysInStage: 60, health: 'On Track' },
  { id: 112, loanNumber: '#4901', borrower: 'Priscilla Nunez', address: '743 Meadowlark Dr', stage: 'underwriting', amount: '$298,000', officer: 'Marcus Webb', daysInStage: 5, health: 'On Track' },
]

export const drawRequestsByLoanNumber = {
  '#1187': [
    { id: 3, label: 'Draw #3', amount: '$85,000', requestedDate: 'Aug 5, 2026', stage: 2, comment: 'Kitchen and bath rough-in complete, ready for inspection sign-off.', documents: ['Kitchen_Rough_In.jpg', 'Bath_Rough_In.jpg'] },
    { id: 2, label: 'Draw #2', amount: '$62,500', requestedDate: 'Jul 10, 2026', stage: 3, comment: 'Framing and roofing complete.', documents: ['Framing_Complete.jpg', 'Roof_Final.jpg', 'Inspector_Report.pdf'] },
    { id: 1, label: 'Draw #1', amount: '$40,000', requestedDate: 'Jun 2, 2026', stage: 3, comment: 'Site prep and demo complete.', documents: ['Demo_Photos.zip'] },
  ],
  '#2304': [
    { id: 2, label: 'Draw #2', amount: '$35,000', requestedDate: 'May 18, 2026', stage: 3, comment: 'Final punch list and cleanup complete.', documents: ['Punch_List_Signoff.pdf'] },
    { id: 1, label: 'Draw #1', amount: '$25,000', requestedDate: 'Apr 22, 2026', stage: 3, comment: 'Interior refresh and rental-ready upgrades complete.', documents: [] },
  ],
}

export const taskStatusStyles = {
  Open: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  Done: 'bg-emerald-100 text-emerald-700',
}

export const taskPriorityStyles = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-slate-100 text-slate-600',
}

export const tasks = [
  { id: 1, title: 'Review updated insurance certificate', assignee: 'Sarah Jenkins', loanNumber: '#1187', borrower: 'Alex Rivera', dueDate: 'Aug 18, 2026', priority: 'High', status: 'Open' },
  { id: 2, title: 'Order appraisal', assignee: 'Marcus Webb', loanNumber: '#4521', borrower: 'Dante Osei', dueDate: 'Aug 19, 2026', priority: 'High', status: 'In Progress' },
  { id: 3, title: 'Chase down entity resolution doc', assignee: 'Sarah Jenkins', loanNumber: '#3092', borrower: 'Alex Rivera', dueDate: 'Aug 20, 2026', priority: 'Medium', status: 'Open' },
  { id: 4, title: 'Schedule closing walkthrough', assignee: 'Priya Nair', loanNumber: '#4788', borrower: 'Jenna Park', dueDate: 'Aug 21, 2026', priority: 'Medium', status: 'In Progress' },
  { id: 5, title: 'Confirm wire instructions with title co.', assignee: 'Priya Nair', loanNumber: '#4823', borrower: 'Tasha Reynolds', dueDate: 'Aug 18, 2026', priority: 'High', status: 'Open' },
  { id: 6, title: 'Send welcome packet', assignee: 'Marcus Webb', loanNumber: '#4810', borrower: 'Leo Bianchi', dueDate: 'Aug 17, 2026', priority: 'Low', status: 'Done' },
  { id: 7, title: 'Verify bank statements', assignee: 'Marcus Webb', loanNumber: '#4901', borrower: 'Priscilla Nunez', dueDate: 'Aug 22, 2026', priority: 'Medium', status: 'Open' },
  { id: 8, title: 'Draw #3 inspection sign-off', assignee: 'Devon Ellis', loanNumber: '#1187', borrower: 'Alex Rivera', dueDate: 'Aug 19, 2026', priority: 'High', status: 'In Progress' },
  { id: 9, title: 'Approve conditional approval letter', assignee: 'Sarah Jenkins', loanNumber: '#4633', borrower: 'Grace Whitfield', dueDate: 'Aug 23, 2026', priority: 'Medium', status: 'Open' },
  { id: 10, title: 'Reconcile payoff statement', assignee: 'Lena Choi', loanNumber: '#2304', borrower: 'Alex Rivera', dueDate: 'Aug 17, 2026', priority: 'Low', status: 'Done' },
]

export const missingDocuments = [
  { id: 1, borrower: 'Alex Rivera', loanNumber: '#3092', document: 'Entity Docs', requestedDate: 'Aug 5, 2026', daysOutstanding: 12 },
  { id: 2, borrower: 'Dante Osei', loanNumber: '#4521', document: 'Proof of Insurance', requestedDate: 'Aug 10, 2026', daysOutstanding: 7 },
  { id: 3, borrower: 'Grace Whitfield', loanNumber: '#4633', document: 'Operating Agreement', requestedDate: 'Aug 6, 2026', daysOutstanding: 11 },
  { id: 4, borrower: 'Priscilla Nunez', loanNumber: '#4901', document: 'Bank Statements (2 months)', requestedDate: 'Aug 13, 2026', daysOutstanding: 4 },
  { id: 5, borrower: 'Tasha Reynolds', loanNumber: '#4823', document: "Driver's License", requestedDate: 'Aug 14, 2026', daysOutstanding: 3 },
]

export const recentUploads = [
  { id: 1, fileName: 'Insurance_Certificate.pdf', borrower: 'Grace Whitfield', loanNumber: '#4633', uploadedBy: 'Grace Whitfield (Borrower)', uploadedAt: 'Today, 9:14 AM', fileType: 'pdf' },
  { id: 2, fileName: 'Appraisal_Report_Final.pdf', borrower: 'Alex Rivera', loanNumber: '#1187', uploadedBy: 'Priya Nair (Closer)', uploadedAt: 'Today, 8:02 AM', fileType: 'pdf' },
  { id: 3, fileName: 'Bank_Statement_July.pdf', borrower: 'Priscilla Nunez', loanNumber: '#4901', uploadedBy: 'Priscilla Nunez (Borrower)', uploadedAt: 'Yesterday, 4:47 PM', fileType: 'pdf' },
  { id: 4, fileName: 'Purchase_Contract_Signed.pdf', borrower: 'Leo Bianchi', loanNumber: '#4810', uploadedBy: 'Leo Bianchi (Borrower)', uploadedAt: 'Yesterday, 2:10 PM', fileType: 'pdf' },
  { id: 5, fileName: 'Scope_of_Work_v2.xlsx', borrower: 'Dante Osei', loanNumber: '#4521', uploadedBy: 'Marcus Webb (Processor)', uploadedAt: 'Aug 15, 2026, 11:30 AM', fileType: 'xlsx' },
  { id: 6, fileName: 'Title_Commitment.pdf', borrower: 'Jenna Park', loanNumber: '#4788', uploadedBy: 'Priya Nair (Closer)', uploadedAt: 'Aug 15, 2026, 9:05 AM', fileType: 'pdf' },
]

export const milestoneStatusStyles = {
  complete: { classes: 'bg-emerald-100 text-emerald-700', icon: 'CircleCheck' },
  current: { classes: 'bg-blue-100 text-blue-700', icon: 'Clock' },
  upcoming: { classes: 'bg-slate-100 text-slate-500', icon: 'Circle' },
}

export const milestonesByLoan = {
  '#1187': [
    { key: 'application', label: 'Application Submitted', status: 'complete', date: 'Jul 18, 2026' },
    { key: 'docs', label: 'Docs Collected', status: 'complete', date: 'Jul 22, 2026' },
    { key: 'underwriting', label: 'Underwriting', status: 'current', date: 'In progress' },
    { key: 'appraisal', label: 'Appraisal', status: 'complete', date: 'Aug 16, 2026' },
    { key: 'conditional', label: 'Conditional Approval', status: 'upcoming', date: '—' },
    { key: 'ctc', label: 'Clear to Close', status: 'upcoming', date: '—' },
    { key: 'closing', label: 'Closing', status: 'upcoming', date: '—' },
    { key: 'funded', label: 'Funded', status: 'upcoming', date: '—' },
  ],
  '#4788': [
    { key: 'application', label: 'Application Submitted', status: 'complete', date: 'Jun 30, 2026' },
    { key: 'docs', label: 'Docs Collected', status: 'complete', date: 'Jul 8, 2026' },
    { key: 'underwriting', label: 'Underwriting', status: 'complete', date: 'Jul 20, 2026' },
    { key: 'appraisal', label: 'Appraisal', status: 'complete', date: 'Jul 24, 2026' },
    { key: 'conditional', label: 'Conditional Approval', status: 'complete', date: 'Jul 30, 2026' },
    { key: 'ctc', label: 'Clear to Close', status: 'complete', date: 'Aug 12, 2026' },
    { key: 'closing', label: 'Closing', status: 'current', date: 'Scheduled Aug 21, 2026' },
    { key: 'funded', label: 'Funded', status: 'upcoming', date: '—' },
  ],
  '#4521': [
    { key: 'application', label: 'Application Submitted', status: 'complete', date: 'Aug 4, 2026' },
    { key: 'docs', label: 'Docs Collected', status: 'current', date: 'In progress' },
    { key: 'underwriting', label: 'Underwriting', status: 'upcoming', date: '—' },
    { key: 'appraisal', label: 'Appraisal', status: 'upcoming', date: '—' },
    { key: 'conditional', label: 'Conditional Approval', status: 'upcoming', date: '—' },
    { key: 'ctc', label: 'Clear to Close', status: 'upcoming', date: '—' },
    { key: 'closing', label: 'Closing', status: 'upcoming', date: '—' },
    { key: 'funded', label: 'Funded', status: 'upcoming', date: '—' },
  ],
}

export const internalNotesByLoan = {
  '#1187': [
    { id: 1, author: 'Sarah Jenkins', avatar: teamMembers[0].avatar, timestamp: 'Today, 10:41 AM', note: 'Borrower called re: insurance delay — agent says cert will be ready by Friday. Flagged as low risk to timeline.' },
    { id: 2, author: 'Priya Nair', avatar: teamMembers[2].avatar, timestamp: 'Yesterday, 3:15 PM', note: 'Appraisal came back at $650k, comfortably supports the ARV assumption. No red flags.' },
    { id: 3, author: 'Devon Ellis', avatar: teamMembers[3].avatar, timestamp: 'Aug 5, 2026, 1:02 PM', note: 'Draw #3 site photos look good, recommending inspection be scheduled next week.' },
  ],
  '#4633': [
    { id: 1, author: 'Priya Nair', avatar: teamMembers[2].avatar, timestamp: 'Today, 8:50 AM', note: 'Borrower is slow to respond on the operating agreement — third request sent. Consider escalating to phone call.' },
  ],
  '#4823': [
    { id: 1, author: 'Priya Nair', avatar: teamMembers[2].avatar, timestamp: 'Yesterday, 5:20 PM', note: "Title company confirmed wire instructions verbally, waiting on written confirmation before we release borrower's copy." },
  ],
}

export const crmSyncStyles = {
  Synced: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-800',
  Error: 'bg-red-100 text-red-700',
}

export const crmRecords = [
  { id: 1, borrower: 'Alex Rivera', loanNumber: '#1187', crmId: 'CRM-88213', syncStatus: 'Synced', lastSynced: 'Today, 9:00 AM', dealStage: 'Underwriting', leadSource: 'Referral Partner', tags: ['Repeat Client', 'Fix & Flip'] },
  { id: 2, borrower: 'Monica Diaz', loanNumber: '#4410', crmId: 'CRM-88871', syncStatus: 'Pending', lastSynced: '—', dealStage: 'New Application', leadSource: 'Website Form', tags: ['New Lead'] },
  { id: 3, borrower: 'Dante Osei', loanNumber: '#4521', crmId: 'CRM-89014', syncStatus: 'Synced', lastSynced: 'Today, 7:45 AM', dealStage: 'Processing', leadSource: 'Google Ads', tags: ['DSCR'] },
  { id: 4, borrower: 'Grace Whitfield', loanNumber: '#4633', crmId: 'CRM-89102', syncStatus: 'Error', lastSynced: 'Aug 14, 2026, 6:30 PM', dealStage: 'Underwriting', leadSource: 'Referral Partner', tags: ['Escalated'] },
  { id: 5, borrower: 'Omar Haddad', loanNumber: '#4702', crmId: 'CRM-89250', syncStatus: 'Synced', lastSynced: 'Today, 8:15 AM', dealStage: 'Approved', leadSource: 'Repeat Client', tags: ['Ground-Up'] },
  { id: 6, borrower: 'Jenna Park', loanNumber: '#4788', crmId: 'CRM-89310', syncStatus: 'Synced', lastSynced: 'Today, 6:55 AM', dealStage: 'Closing', leadSource: 'Broker', tags: ['Bridge'] },
]

export const communicationsByBorrower = {
  'Alex Rivera': {
    emails: [
      { id: 1, subject: 'Insurance certificate needed to proceed', direction: 'outbound', with: 'Sarah Jenkins', timestamp: 'Aug 15, 2026, 4:12 PM', preview: 'Hi Alex, just following up — we still need proof of insurance to move forward with underwriting.' },
      { id: 2, subject: 'Re: Insurance certificate needed to proceed', direction: 'inbound', with: 'Alex Rivera', timestamp: 'Aug 15, 2026, 4:45 PM', preview: 'Got it, working on it with my insurance agent now.' },
      { id: 3, subject: 'Appraisal complete — good news!', direction: 'outbound', with: 'Sarah Jenkins', timestamp: 'Aug 16, 2026, 10:32 AM', preview: 'The appraisal came back today, so we are on track once that document is in.' },
    ],
    sms: [
      { id: 1, direction: 'outbound', with: 'Sarah Jenkins', timestamp: 'Aug 14, 2026, 5:02 PM', text: 'Reminder: insurance doc is due tomorrow to keep underwriting on schedule.' },
      { id: 2, direction: 'inbound', with: 'Alex Rivera', timestamp: 'Aug 14, 2026, 5:20 PM', text: 'On it, should have it today or tomorrow AM.' },
    ],
  },
  'Grace Whitfield': {
    emails: [
      { id: 1, subject: 'Operating agreement — 3rd request', direction: 'outbound', with: 'Priya Nair', timestamp: 'Aug 17, 2026, 8:50 AM', preview: 'Hi Grace, we still need the signed operating agreement to keep underwriting moving.' },
    ],
    sms: [
      { id: 1, direction: 'outbound', with: 'Priya Nair', timestamp: 'Aug 16, 2026, 2:00 PM', text: 'Quick nudge — operating agreement still outstanding, can you send today?' },
    ],
  },
  'Tasha Reynolds': {
    emails: [
      { id: 1, subject: 'Wire instructions confirmation', direction: 'outbound', with: 'Priya Nair', timestamp: 'Aug 16, 2026, 5:20 PM', preview: 'Confirming wire instructions with the title company before closing — will follow up shortly.' },
    ],
    sms: [],
  },
}

export const commonDocumentRequests = [
  'Proof of Insurance',
  'Bank Statements (2 months)',
  'Entity Docs',
  "Driver's License",
  'Operating Agreement',
]

export const messagesByBorrower = {
  'Dante Osei': {
    unread: true,
    updatedAt: 10,
    messages: [
      { id: 1, type: 'doc_request', sender: 'staff', author: 'Marcus Webb', timestamp: 'Today, 9:40 AM', document: 'Proof of Insurance' },
      { id: 2, type: 'text', sender: 'borrower', author: 'Dante Osei', timestamp: 'Today, 9:52 AM', text: 'Do you need the homeowner policy or the builder’s risk policy?' },
    ],
  },
  'Grace Whitfield': {
    unread: true,
    updatedAt: 45,
    messages: [
      { id: 1, type: 'text', sender: 'staff', author: 'Priya Nair', timestamp: 'Aug 17, 2026, 8:50 AM', text: 'Hi Grace, we still need the signed operating agreement to keep underwriting moving.' },
      { id: 2, type: 'text', sender: 'borrower', author: 'Grace Whitfield', timestamp: 'Today, 9:15 AM', text: 'Sorry for the delay — I’ll have it over to you by Friday.' },
    ],
  },
  'Alex Rivera': {
    unread: false,
    updatedAt: 180,
    messages: [
      { id: 1, type: 'text', sender: 'staff', author: 'Sarah Jenkins', timestamp: 'Aug 15, 2026, 4:12 PM', text: 'Hi Alex, just checking in — we still need proof of insurance to move forward with underwriting.' },
      { id: 2, type: 'text', sender: 'borrower', author: 'Alex Rivera', timestamp: 'Aug 15, 2026, 4:45 PM', text: 'Got it, working on it with my insurance agent now.' },
      { id: 3, type: 'text', sender: 'staff', author: 'Sarah Jenkins', timestamp: 'Aug 16, 2026, 10:32 AM', text: 'The appraisal came back today, so we are on track once that document is in.' },
    ],
  },
  'Tasha Reynolds': {
    unread: false,
    updatedAt: 720,
    messages: [
      { id: 1, type: 'text', sender: 'staff', author: 'Priya Nair', timestamp: 'Aug 16, 2026, 5:20 PM', text: 'Confirming wire instructions with the title company before closing — will follow up shortly.' },
    ],
  },
}

