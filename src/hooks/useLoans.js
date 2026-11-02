import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMyLoans } from '../api/loans'
import { fetchLoanStages } from '../api/admin'
import { fetchDocumentRequests } from '../api/documents'
import { fetchDraws, fetchDrawSummary } from '../api/draws'
import { FUNDED_STAGE, stageKey, stageLabel, stageNote } from '../common/constants/loanStages'
import { drawStatusLabel, money } from '../utils/draws'
import { currency, formatDate } from '../utils/format'

// DocumentRequest statuses that are waiting on the borrower
export const awaitingStatuses = ['requested', 'needs_revision', 'rejected']

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

// The pipeline's stages rarely change: fetch them once per page load
let stagesPromise = null
function loadStages() {
  stagesPromise ??= fetchLoanStages().catch((err) => {
    stagesPromise = null
    throw err
  })
  return stagesPromise
}

// Each stage marked complete / current / upcoming. Funded is the end of the road, so from
// there on every stage up to the current one shows complete.
function buildStages(stages, currentId) {
  const currentIndex = stages.findIndex((s) => s.id === currentId)
  if (currentIndex === -1) return { stages: [], currentIndex, funded: false }
  const fundedIndex = stages.findIndex((s) => stageKey(s.name) === FUNDED_STAGE)
  const funded = fundedIndex !== -1 && currentIndex >= fundedIndex
  return {
    currentIndex,
    funded,
    stages: stages.map((s, i) => ({
      key: s.id,
      label: stageLabel(s.name),
      state: i < currentIndex || (funded && i === currentIndex) ? 'complete' : i === currentIndex ? 'current' : 'upcoming',
    })),
  }
}

// Recent events, newest first, from the loan's document requests and draws.
// `you` marks the ones still waiting on the borrower.
function buildActivity(loan, requests, draws) {
  const items = []
  const add = (at, title, you = false) => at && items.push({ at, title, you })

  add(loan.raw?.created_at, 'Loan opened')
  for (const r of requests) {
    add(r.requested_at, `${r.name} requested`, r.status === 'requested')
    for (const doc of r.documents ?? []) add(doc.uploaded_at, `${doc.name} uploaded`)
    if (r.reviewed_at && r.status === 'uploaded') add(r.reviewed_at, `${r.name} approved`)
    if (r.reviewed_at && ['needs_revision', 'rejected'].includes(r.status)) add(r.reviewed_at, `${r.name} needs changes`, true)
  }
  for (const d of draws) {
    add(d.submitted_at, `Draw #${d.number} submitted for ${money(d.amount_requested)}`)
    for (const c of d.status_changes ?? []) {
      if (c.to_status !== 'submitted') add(c.changed_at, `Draw #${d.number}: ${drawStatusLabel(c.to_status)}`)
    }
  }

  return items
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6)
    .map((item, i) => ({ id: i, title: item.title, time: formatDate(item.at), you: item.you }))
}

// Everything the dashboard shows for one loan: its place in the pipeline, document requests,
// draws and recent activity. reload() refetches after an upload.
export function useLoanDetail(loan) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // The loan on screen, so a slow response for a loan switched away from is dropped
  const current = useRef(loan)
  current.current = loan

  const reload = useCallback(async () => {
    if (!loan) return
    const stale = () => current.current !== loan
    try {
      const [stages, requests, draws, drawSummary] = await Promise.all([
        loadStages().catch(() => []),
        fetchDocumentRequests(loan.id),
        // Draws only matter once funded; a loan without them shouldn't break the dashboard
        fetchDraws(loan.id).catch(() => []),
        fetchDrawSummary(loan.id).catch(() => null),
      ])
      if (stale()) return
      const pipeline = buildStages(stages ?? [], loan.statusKey)
      const reqs = requests ?? []
      const officer = loan.loanOfficer
      setDetail({
        loan,
        stageLabel: loan.stageName ? stageLabel(loan.stageName) : null,
        stageNote: stageNote(loan.stageName),
        stages: pipeline.stages,
        funded: pipeline.funded,
        requests: reqs,
        needed: reqs.filter((r) => awaitingStatuses.includes(r.status)),
        inReview: reqs.filter((r) => r.status === 'pending_review'),
        received: reqs.filter((r) => r.status === 'uploaded'),
        draws: draws ?? [],
        drawSummary,
        assignedOfficer: officer
          ? { name: officer.full_name?.trim() || officer.email, email: officer.email, phone: officer.phone }
          : null,
        recentActivity: buildActivity(loan, reqs, draws ?? []),
      })
      setError('')
    } catch (err) {
      if (!stale()) setError(err.message || 'Failed to load loan details')
    } finally {
      if (!stale()) setLoading(false)
    }
  }, [loan])

  useEffect(() => {
    setDetail(null)
    setError('')
    setLoading(Boolean(loan))
    reload()
  }, [reload, loan])

  return { detail, loading, error, reload }
}
