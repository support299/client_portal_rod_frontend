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
    health: 'Waiting on You',
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
    health: 'On Track',
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
    health: 'Needs Attention',
  },
]

export const loanStatusStyles = {
  Processing: 'bg-blue-100 text-blue-700',
  Funded: 'bg-emerald-100 text-emerald-700',
  Underwriting: 'bg-amber-100 text-amber-800',
}

export const dealHealthConfig = {
  'On Track': { classes: 'bg-emerald-100 text-emerald-700', icon: 'CircleCheck' },
  'Needs Attention': { classes: 'bg-amber-100 text-amber-800', icon: 'AlertTriangle' },
  'Waiting on You': { classes: 'bg-red-100 text-red-700', icon: 'UserRoundCheck' },
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

export const documentStatusStyles = {
  Uploaded: { classes: 'bg-emerald-100 text-emerald-700', icon: 'CircleCheck' },
  'Pending Review': { classes: 'bg-blue-100 text-blue-700', icon: 'Clock' },
  'Needs Revision': { classes: 'bg-amber-100 text-amber-800', icon: 'PencilLine' },
  Rejected: { classes: 'bg-red-100 text-red-700', icon: 'CircleX' },
}

export const documentsNeeded = [
  { id: 1, name: "Driver's License", status: 'Uploaded' },
  { id: 2, name: 'Bank Statements', status: 'Uploaded' },
  { id: 3, name: 'Purchase Contract', status: 'Pending Review' },
  { id: 4, name: 'Scope of Work', status: 'Pending Review' },
  { id: 5, name: 'Insurance', status: 'Needs Revision' },
  { id: 6, name: 'Entity Docs', status: 'Rejected' },
]

export const documentsSent = [
  { id: 1, name: 'Loan Estimate', sentDate: 'Jul 20, 2026' },
  { id: 2, name: 'Commitment Letter', sentDate: 'Jul 28, 2026' },
  { id: 3, name: 'Closing Instructions', sentDate: 'Aug 2, 2026' },
  { id: 4, name: 'Settlement Statement', sentDate: 'Aug 8, 2026' },
  { id: 5, name: 'Wire Instructions', sentDate: 'Aug 8, 2026' },
  { id: 6, name: 'Final Loan Documents', sentDate: 'Aug 10, 2026' },
]

export const loanSummaries = [
  {
    id: 1,
    loanName: 'Loan #1187',
    address: '123 Main Street',
    loanAmount: '$450,000',
    interestRate: '6.25%',
    ltv: '70%',
    arv: '$650,000',
    loanType: 'Fix & Flip Bridge Loan',
    term: '12 months',
    closingDate: 'Aug 15, 2026',
    maturityDate: 'Aug 15, 2027',
    monthlyPayment: '$2,343.75',
    constructionHoldback: '$65,000',
  },
  {
    id: 2,
    loanName: 'Loan #2304',
    address: '456 Oak Drive',
    loanAmount: '$610,000',
    interestRate: '7.10%',
    ltv: '65%',
    arv: '$890,000',
    loanType: 'Bridge-to-Rental Loan',
    term: '18 months',
    closingDate: 'Jun 1, 2026',
    maturityDate: 'Dec 1, 2027',
    monthlyPayment: '$3,609.17',
    constructionHoldback: '$110,000',
  },
  {
    id: 3,
    loanName: 'Loan #3092',
    address: '789 Maple Ave',
    loanAmount: '$325,000',
    interestRate: '6.75%',
    ltv: '72%',
    arv: '$475,000',
    loanType: 'Fix & Flip Bridge Loan',
    term: '12 months',
    closingDate: 'Pending',
    maturityDate: 'TBD',
    monthlyPayment: '—',
    constructionHoldback: '$50,000',
  },
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

export const drawRequestStages = ['Submitted', 'Inspection Ordered', 'Approved', 'Funds Sent']

export const constructionBudgets = {
  1: { total: 180000, released: 45000, remaining: 135000 },
  2: { total: 60000, released: 60000, remaining: 0 },
  3: { total: 0, released: 0, remaining: 0 },
}

export const drawRequestsByLoan = {
  1: [
    {
      id: 3,
      label: 'Draw #3',
      amount: '$85,000',
      requestedDate: 'Aug 5, 2026',
      stage: 2,
      comment: 'Kitchen and bath rough-in complete, ready for inspection sign-off.',
    },
    {
      id: 2,
      label: 'Draw #2',
      amount: '$62,500',
      requestedDate: 'Jul 10, 2026',
      stage: 3,
      comment: 'Framing and roofing complete.',
    },
    {
      id: 1,
      label: 'Draw #1',
      amount: '$40,000',
      requestedDate: 'Jun 2, 2026',
      stage: 3,
      comment: 'Site prep and demo complete.',
    },
  ],
  2: [
    {
      id: 2,
      label: 'Draw #2',
      amount: '$35,000',
      requestedDate: 'May 18, 2026',
      stage: 3,
      comment: 'Final punch list and cleanup complete.',
    },
    {
      id: 1,
      label: 'Draw #1',
      amount: '$25,000',
      requestedDate: 'Apr 22, 2026',
      stage: 3,
      comment: 'Interior refresh and rental-ready upgrades complete.',
    },
  ],
  3: [],
}

export const resourceCategories = [
  {
    id: 1,
    title: 'Loan Programs',
    description: 'Compare bridge, DSCR, and construction loan options.',
    icon: 'BookOpen',
  },
  {
    id: 2,
    title: 'Fix & Flip Guide',
    description: 'How to underwrite, budget, and time a flip for profit.',
    icon: 'Hammer',
  },
  {
    id: 3,
    title: 'Ground-Up Guide',
    description: 'Draw schedules, permits, and budgeting new construction.',
    icon: 'Building2',
  },
  {
    id: 4,
    title: 'Commercial Lending',
    description: 'What changes when you move from residential to commercial.',
    icon: 'Briefcase',
  },
  {
    id: 5,
    title: 'DSCR Guide',
    description: 'Qualifying rental properties without personal income docs.',
    icon: 'Percent',
  },
  {
    id: 6,
    title: 'Closing Process',
    description: 'What to expect from clear-to-close through funding.',
    icon: 'KeyRound',
  },
  {
    id: 7,
    title: 'FAQ',
    description: 'Answers to the questions borrowers ask most.',
    icon: 'HelpCircle',
  },
  {
    id: 8,
    title: 'Educational Videos',
    description: 'Short walkthroughs of the loan process and tools.',
    icon: 'PlayCircle',
  },
  {
    id: 9,
    title: 'Checklists',
    description: 'Downloadable checklists for every stage of your deal.',
    icon: 'ListChecks',
  },
]

export const teamMembers = [
  {
    id: 1,
    role: 'Loan Officer',
    name: assignedOfficer.name,
    phone: '(555) 210-8842',
    email: 'sarah.jenkins@flipfunding.com',
    avatar: assignedOfficer.avatar,
  },
  {
    id: 2,
    role: 'Processor',
    name: 'Marcus Webb',
    phone: '(555) 347-2210',
    email: 'marcus.webb@flipfunding.com',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  },
  {
    id: 3,
    role: 'Closer',
    name: 'Priya Nair',
    phone: '(555) 481-9034',
    email: 'priya.nair@flipfunding.com',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces',
  },
  {
    id: 4,
    role: 'Draw Specialist',
    name: 'Devon Ellis',
    phone: '(555) 662-1187',
    email: 'devon.ellis@flipfunding.com',
    avatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces',
  },
  {
    id: 5,
    role: 'Accounting',
    name: 'Lena Choi',
    phone: '(555) 774-3356',
    email: 'lena.choi@flipfunding.com',
    avatar:
      'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&crop=faces',
  },
]

export const currentRates = [
  { id: 1, label: 'Fix & Flip Bridge', rate: '6.25% – 7.50%' },
  { id: 2, label: 'DSCR Rental', rate: '7.00% – 8.25%' },
  { id: 3, label: 'Ground-Up Construction', rate: '7.50% – 9.00%' },
  { id: 4, label: '30-Yr Fixed (Conventional)', rate: '6.10% – 6.60%' },
]

export const conditionStatusStyles = {
  Complete: { classes: 'bg-emerald-100 text-emerald-700', icon: 'CircleCheck' },
  Pending: { classes: 'bg-amber-100 text-amber-800', icon: 'Clock' },
  Rejected: { classes: 'bg-red-100 text-red-700', icon: 'CircleX' },
}

export const conditionsList = [
  { id: 1, name: 'Driver License', status: 'Complete' },
  { id: 2, name: 'Insurance', status: 'Complete' },
  { id: 3, name: 'Operating Agreement', status: 'Pending' },
  { id: 4, name: 'Bank Statements', status: 'Pending' },
  { id: 5, name: 'Entity Resolution', status: 'Rejected' },
]

export const businessInfo = {
  name: 'Alex Rivera Investments LLC',
  entityType: 'Real Estate Investment',
  yearsInBusiness: '6 years',
  website: 'www.riverainvestments.com',
}

export const llcInfo = {
  name: 'Alex Rivera Investments LLC',
  stateOfFormation: 'Delaware',
  formationDate: 'Mar 4, 2020',
  registeredAgent: 'Delaware Registered Agents Inc.',
}

export const taxId = {
  ein: '87-4213956',
}

export const bankAccounts = [
  { id: 1, bankName: 'Chase Business Checking', accountType: 'Checking', last4: '4821', primary: true },
  { id: 2, bankName: 'Mercury Savings', accountType: 'Savings', last4: '0093', primary: false },
]

export const authorizedSigners = [
  {
    id: 1,
    name: 'Alex Rivera',
    title: 'Managing Member',
    email: 'alex@riverainvestments.com',
    phone: '(555) 210-4478',
  },
  {
    id: 2,
    name: 'Jordan Kim',
    title: 'Co-Manager',
    email: 'jordan@riverainvestments.com',
    phone: '(555) 884-2291',
  },
]

export const insuranceCertificates = [
  {
    id: 1,
    provider: 'State Farm',
    policyNumber: 'POL-88213-A',
    coverageType: 'Builder’s Risk',
    expiration: 'Jan 15, 2027',
    status: 'Active',
  },
  {
    id: 2,
    provider: 'Liberty Mutual',
    policyNumber: 'POL-44120-C',
    coverageType: 'General Liability',
    expiration: 'Nov 3, 2026',
    status: 'Active',
  },
  {
    id: 3,
    provider: 'Progressive Commercial',
    policyNumber: 'POL-90871-B',
    coverageType: 'Property Insurance',
    expiration: 'Aug 30, 2026',
    status: 'Expiring Soon',
  },
]

export const mailingAddress = {
  line1: '482 Harbor View Terrace',
  line2: 'Suite 210',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
}

export const communicationPreferences = [
  { id: 1, label: 'Email Notifications', description: 'Loan updates, document requests, and messages', enabled: true },
  { id: 2, label: 'SMS Alerts', description: 'Time-sensitive deadlines and draw approvals', enabled: true },
  { id: 3, label: 'Draw Request Updates', description: 'Status changes on submitted draw requests', enabled: true },
  { id: 4, label: 'Marketing & Promotions', description: 'New products, rate changes, referral offers', enabled: false },
]
