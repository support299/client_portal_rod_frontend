import { apiRequest } from './client'

// For a borrower, GET /api/loans/ returns only their own loans (paginated); walk every page
export async function fetchMyLoans() {
  const all = []
  for (let page = 1; ; page += 1) {
    const data = await apiRequest(`/api/loans/?page=${page}&page_size=100`)
    all.push(...(data?.results ?? []))
    if (!data?.next) return all
  }
}

export async function fetchLoanDocuments(opportunityId) {
  return apiRequest(`/api/portal/loans/${encodeURIComponent(opportunityId)}/documents/`)
}

export async function linkGhlContact() {
  return apiRequest('/api/portal/auth/link-contact/', { method: 'POST', body: '{}' })
}
