import { apiRequest } from './client'

export async function fetchMyLoans() {
  return apiRequest('/api/portal/loans/')
}

export async function fetchLoanDetail(opportunityId) {
  return apiRequest(`/api/portal/loans/${encodeURIComponent(opportunityId)}/`)
}

export async function fetchLoanDocuments(opportunityId) {
  return apiRequest(`/api/portal/loans/${encodeURIComponent(opportunityId)}/documents/`)
}

export async function linkGhlContact() {
  return apiRequest('/api/portal/auth/link-contact/', { method: 'POST', body: '{}' })
}
