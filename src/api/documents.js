import { apiRequest } from './client'

function queryString(params = {}) {
  return new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

// JSON, or multipart when a file is included. Null/undefined values are left out (unset), since
// a file field can't be null.
function body(payload) {
  const fields = Object.entries(payload).filter(([, value]) => value != null)
  if (!fields.some(([, value]) => value instanceof File)) return JSON.stringify(Object.fromEntries(fields))
  const form = new FormData()
  fields.forEach(([key, value]) => form.append(key, value))
  return form
}

// Document types (admins manage them; everyone else sees the active ones)

export async function fetchDocumentTypes(params = {}) {
  return apiRequest(`/api/loans/document-types/?${queryString(params)}`)
}

// payload may include template_file (a File) for a fill_form type
export async function createDocumentType(payload) {
  return apiRequest('/api/loans/document-types/', { method: 'POST', body: body(payload) })
}

export async function updateDocumentType(id, payload) {
  return apiRequest(`/api/loans/document-types/${id}/`, { method: 'PATCH', body: body(payload) })
}

// Only deactivates it: requests and files keep pointing at the type
export async function deactivateDocumentType(id) {
  return apiRequest(`/api/loans/document-types/${id}/`, { method: 'DELETE' })
}

export async function fetchDocumentTypeTemplate(id) {
  return apiRequest(`/api/loans/document-types/${id}/template/`, { responseType: 'blob' })
}

// Document requests of one loan, each with its files

export async function fetchDocumentRequests(loanId, params = {}) {
  return apiRequest(`/api/loans/${loanId}/document-requests/?${queryString(params)}`)
}

// payload: document_type and/or name, description, kind, due_date, form_file (a File)
export async function createDocumentRequest(loanId, payload) {
  return apiRequest(`/api/loans/${loanId}/document-requests/`, { method: 'POST', body: body(payload) })
}

export async function updateDocumentRequest(loanId, id, payload) {
  return apiRequest(`/api/loans/${loanId}/document-requests/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteDocumentRequest(loanId, id) {
  return apiRequest(`/api/loans/${loanId}/document-requests/${id}/`, { method: 'DELETE' })
}

// Files of one loan

export async function fetchLoanDocuments(loanId, params = {}) {
  return apiRequest(`/api/loans/${loanId}/documents/?${queryString(params)}`)
}

// payload: file (a File), and optionally request, document_type, direction, visible_to_borrower
export async function uploadLoanDocument(loanId, payload) {
  return apiRequest(`/api/loans/${loanId}/documents/`, { method: 'POST', body: body(payload) })
}

// payload: name, request, document_type, visible_to_borrower, review_status, reviewer_note
export async function updateLoanDocument(loanId, id, payload) {
  return apiRequest(`/api/loans/${loanId}/documents/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteLoanDocument(loanId, id) {
  return apiRequest(`/api/loans/${loanId}/documents/${id}/`, { method: 'DELETE' })
}

// download_url is a path from the API; the file needs the auth header, so it's fetched as a blob
export async function fetchDocumentFile(downloadUrl) {
  return apiRequest(downloadUrl, { responseType: 'blob' })
}

// Open a fetched Blob in a new tab, or save it under `filename`
export function openBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  if (filename) link.download = filename
  else link.target = '_blank'
  link.rel = 'noopener'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
