import { apiRequest } from './client'

// Draw requests of one loan, each with its files, status history and allowed_statuses.
// Files are uploaded with uploadLoanDocument(loanId, { file, draw: drawId }) from ./documents.

export async function fetchDraws(loanId, params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  return apiRequest(`/api/loans/${loanId}/draws/?${query}`)
}

// { holdback, redeemed, in_progress, available }; available is null when the loan has no holdback
export async function fetchDrawSummary(loanId) {
  return apiRequest(`/api/loans/${loanId}/draws/summary/`)
}

// payload: amount_requested, borrower_comment
export async function createDraw(loanId, payload) {
  return apiRequest(`/api/loans/${loanId}/draws/`, { method: 'POST', body: JSON.stringify(payload) })
}

// Borrowers: amount_requested, borrower_comment. Staff also: amount_approved, staff_note,
// inspector, inspection_date, funding_reference
export async function updateDraw(loanId, id, payload) {
  return apiRequest(`/api/loans/${loanId}/draws/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
}

// payload: status, note, and (staff) amount_approved, funding_reference
export async function changeDrawStatus(loanId, id, payload) {
  return apiRequest(`/api/loans/${loanId}/draws/${id}/status/`, { method: 'POST', body: JSON.stringify(payload) })
}

// Admins only; the draw is hidden, its files and history stay
export async function deleteDraw(loanId, id) {
  return apiRequest(`/api/loans/${loanId}/draws/${id}/`, { method: 'DELETE' })
}
