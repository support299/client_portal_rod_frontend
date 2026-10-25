// Keyed by Loan.Status label, as the borrower dashboard shows it
export const loanStatusStyles = {
  'Application Received': 'bg-slate-100 text-slate-600',
  Processing: 'bg-blue-100 text-blue-700',
  Underwriting: 'bg-amber-100 text-amber-800',
  Appraisal: 'bg-orange-100 text-orange-700',
  'Final Approval': 'bg-cyan-100 text-cyan-700',
  Closing: 'bg-purple-100 text-purple-700',
  Funded: 'bg-emerald-100 text-emerald-700',
}

export const dealHealthConfig = {
  'On Track': { classes: 'bg-emerald-100 text-emerald-700', icon: 'CircleCheck' },
  'Needs Attention': { classes: 'bg-amber-100 text-amber-800', icon: 'AlertTriangle' },
  'Waiting on You': { classes: 'bg-red-100 text-red-700', icon: 'UserRoundCheck' },
}

export const documentStatusStyles = {
  Uploaded: { classes: 'bg-emerald-100 text-emerald-700', icon: 'CircleCheck' },
  'Pending Review': { classes: 'bg-blue-100 text-blue-700', icon: 'Clock' },
  'Needs Revision': { classes: 'bg-amber-100 text-amber-800', icon: 'PencilLine' },
  Rejected: { classes: 'bg-red-100 text-red-700', icon: 'CircleX' },
}

export const conditionStatusStyles = {
  Complete: { classes: 'bg-emerald-100 text-emerald-700', icon: 'CircleCheck' },
  Pending: { classes: 'bg-amber-100 text-amber-800', icon: 'Clock' },
  Rejected: { classes: 'bg-red-100 text-red-700', icon: 'CircleX' },
}

export const milestoneStatusStyles = {
  complete: { classes: 'bg-emerald-100 text-emerald-700', icon: 'CircleCheck' },
  current: { classes: 'bg-blue-100 text-blue-700', icon: 'Clock' },
  upcoming: { classes: 'bg-slate-100 text-slate-500', icon: 'Circle' },
}

export const crmSyncStyles = {
  Synced: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-800',
  Error: 'bg-red-100 text-red-700',
}

export const userRoleStyles = {
  borrower: 'bg-slate-100 text-slate-600',
  loan_officer: 'bg-emerald-100 text-emerald-700',
  processor: 'bg-blue-100 text-blue-700',
  closer: 'bg-purple-100 text-purple-700',
  draw_specialist: 'bg-amber-100 text-amber-800',
  accounting: 'bg-cyan-100 text-cyan-700',
  admin: 'bg-red-100 text-red-700',
}

export const drawRequestStages = ['Submitted', 'Inspection Ordered', 'Approved', 'Funds Sent']

// Keyed by DrawRequest.Status: [label, badge classes, step in drawRequestStages (null: off the main path)]
export const drawStatusStyles = {
  submitted: ['Submitted', 'bg-slate-100 text-slate-600', 0],
  needs_info: ['Needs Info', 'bg-amber-100 text-amber-800', null],
  inspection_ordered: ['Inspection Ordered', 'bg-blue-100 text-blue-700', 1],
  inspected: ['Inspected', 'bg-blue-100 text-blue-700', 1],
  approved: ['Approved', 'bg-cyan-100 text-cyan-700', 2],
  funded: ['Funded', 'bg-emerald-100 text-emerald-700', 4],
  rejected: ['Rejected', 'bg-red-100 text-red-700', null],
  cancelled: ['Cancelled', 'bg-slate-100 text-slate-400', null],
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
