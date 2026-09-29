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
  BORROWER: 'bg-slate-100 text-slate-600',
  LOAN_OFFICER: 'bg-emerald-100 text-emerald-700',
  PROCESSOR: 'bg-blue-100 text-blue-700',
  CLOSER: 'bg-purple-100 text-purple-700',
  DRAW_SPECIALIST: 'bg-amber-100 text-amber-800',
  ADMIN: 'bg-red-100 text-red-700',
}

export const drawRequestStages = ['Submitted', 'Inspection Ordered', 'Approved', 'Funds Sent']

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
