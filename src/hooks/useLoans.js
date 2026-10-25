import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMyLoans } from '../api/loans'
import { currency, formatDate } from '../utils/format'

// Loan.Status progression on the backend, in order
const loanStageOrder = [
  { key: 'application_received', label: 'Application Received' },
  { key: 'processing', label: 'Processing' },
  { key: 'underwriting', label: 'Underwriting' },
  { key: 'appraisal', label: 'Appraisal' },
  { key: 'final_approval', label: 'Final Approval' },
  { key: 'closing', label: 'Closing' },
  { key: 'funded', label: 'Funded' },
]

// Map a /api/loans/ loan onto the fields the borrower dashboard components read
function toDashboardLoan(loan) {
  const amount = Number(loan.loan_amount)
  const closeDate = formatDate(loan.expected_close_date)
  const name = loan.name || `Loan #${loan.id}`
  return {
    id: loan.id,
    address: name,
    loanName: name,
    statusKey: loan.status,
    status: loan.status_label,
    stageName: loan.status_label,
    loanAmount: amount ? currency.format(amount) : null,
    estimatedEndDate: closeDate,
    closingDate: closeDate,
    loanOfficer: loan.loan_officer,
    raw: loan,
  }
}

// Funded is the last step, so it shows as complete rather than in progress
function buildLoanStages(statusKey) {
  const index = loanStageOrder.findIndex((s) => s.key === statusKey)
  if (index === -1) return []
  const currentIndex = statusKey === 'funded' ? loanStageOrder.length : index
  return loanStageOrder.map((stage, i) => ({
    ...stage,
    state: i < currentIndex ? 'complete' : i === currentIndex ? 'current' : 'upcoming',
  }))
}

export function useMyLoans() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchMyLoans()
      setLoans(data.map(toDashboardLoan))
    } catch (err) {
      setError(err.message || 'Failed to load loans')
      setLoans([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { loans, loading, error, reload }
}

// There is no borrower loan-detail endpoint, so the detail is derived from the list entry
export function useLoanDetail(loan) {
  const detail = useMemo(() => {
    if (!loan) return null
    const officer = loan.loanOfficer
    return {
      loan,
      currentStatus: { label: loan.status },
      loanStages: buildLoanStages(loan.statusKey),
      assignedOfficer: officer
        ? { name: officer.full_name?.trim() || officer.email, title: 'Loan officer', email: officer.email, phone: officer.phone }
        : null,
      recentActivity: [],
    }
  }, [loan])

  return { detail, loading: false, error: '' }
}
