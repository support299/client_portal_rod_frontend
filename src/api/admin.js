import { apiRequest } from './client'

export async function fetchAllLoans() {
  return apiRequest('/api/portal/admin/loans/')
}

export async function updateLoanStatus(opportunityId, status) {
  return apiRequest(`/api/portal/admin/loans/${encodeURIComponent(opportunityId)}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
