import { apiRequest } from './client'

export async function fetchAllLoans() {
  return apiRequest('/api/portal/admin/loans/')
}

export async function fetchOpportunityFilters() {
  return apiRequest('/crm/opportunities/filters/')
}

export async function fetchOpportunities(params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  return apiRequest(`/crm/opportunities/?${query}`)
}

export async function fetchLoans(params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  return apiRequest(`/api/loans/?${query}`)
}

export async function updateLoan(id, payload) {
  return apiRequest(`/api/loans/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function createLoanFromOpportunity(opportunityId) {
  return apiRequest('/api/loans/from-opportunity/', {
    method: 'POST',
    body: JSON.stringify({ opportunity_id: opportunityId }),
  })
}

export async function searchCrmUsers(search) {
  const params = new URLSearchParams({ search, page_size: '10' })
  return apiRequest(`/crm/users/?${params}`)
}

export async function fetchUsers(params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  return apiRequest(`/api/auth/users/?${query}`)
}

export async function createUser(payload) {
  return apiRequest('/api/auth/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateUser(id, payload) {
  return apiRequest(`/api/auth/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function updateLoanStatus(opportunityId, status) {
  return apiRequest(`/api/portal/admin/loans/${encodeURIComponent(opportunityId)}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
