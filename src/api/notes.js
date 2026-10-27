import { apiRequest } from './client'

// Internal notes of one loan: staff only (admins and the loan's officers), never shown to the borrower.
// Each note has can_edit: the user wrote it or is an admin.

// params: pinned ('true' for pinned only)
export async function fetchNotes(loanId, params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  return apiRequest(`/api/loans/${loanId}/notes/?${query}`)
}

// payload: body, is_pinned
export async function createNote(loanId, payload) {
  return apiRequest(`/api/loans/${loanId}/notes/`, { method: 'POST', body: JSON.stringify(payload) })
}

// payload: body and/or is_pinned; author or admin only
export async function updateNote(loanId, id, payload) {
  return apiRequest(`/api/loans/${loanId}/notes/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
}

// Author or admin only; the note is hidden
export async function deleteNote(loanId, id) {
  return apiRequest(`/api/loans/${loanId}/notes/${id}/`, { method: 'DELETE' })
}
