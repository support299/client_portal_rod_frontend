// Borrower-facing wording for the 02 Processing pipeline's stages, keyed by the GHL stage name
// (upper-cased). A stage not listed here shows its GHL name and no explanation.
export const stageCopy = {
  'QC REVIEW': {
    label: 'Application Review',
    note: 'We’re checking that your application is complete.',
  },
  'DOCUMENT UPLOADED': {
    label: 'Documents Received',
    note: 'We’ve received your documents and are reviewing them.',
  },
  ONBOARDED: {
    label: 'Onboarded',
    note: 'Your loan is set up and your file is being prepared for processing.',
  },
  PROCESSING: {
    label: 'Processing',
    note: 'We’re verifying your documents and ordering title and the appraisal.',
  },
  UNDERWRITING: {
    label: 'Underwriting',
    note: 'Underwriting is reviewing the deal, the property and your experience.',
  },
  'CLEAR TO CLOSE': {
    label: 'Clear to Close',
    note: 'Your loan is approved. We’re scheduling closing with the title company.',
  },
  FUNDED: {
    label: 'Funded',
    note: 'Your loan is funded. Request a draw as rehab work is completed.',
  },
  'POST CLOSING': {
    label: 'Post Closing',
    note: 'Your loan has closed. Request a draw as rehab work is completed.',
  },
}

// Stages from this one on count as funded
export const FUNDED_STAGE = 'FUNDED'

const titleCase = (name) => name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

export function stageKey(name) {
  return (name || '').trim().toUpperCase()
}

export function stageLabel(name) {
  return stageCopy[stageKey(name)]?.label ?? titleCase((name || '').trim())
}

export function stageNote(name) {
  return stageCopy[stageKey(name)]?.note ?? null
}
