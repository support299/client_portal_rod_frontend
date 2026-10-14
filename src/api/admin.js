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

function queryString(params) {
  return new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

// Webhook deliveries received from GHL (admin only; the list has no payload)
export async function fetchWebhookLogs(params = {}) {
  return apiRequest(`/api/crm/webhook/logs/?${queryString(params)}`)
}

export async function fetchWebhookLog(id) {
  return apiRequest(`/api/crm/webhook/logs/${id}/`)
}

// Calls we made to GHL (admin only; the list has no request/response bodies)
export async function fetchOutboundLogs(params = {}) {
  return apiRequest(`/crm/outbound-logs/?${queryString(params)}`)
}

export async function fetchOutboundLog(id) {
  return apiRequest(`/crm/outbound-logs/${id}/`)
}

export async function fetchLoan(id) {
  return apiRequest(`/api/loans/${id}/`)
}

// The loan pipeline's stages in order; a loan's status is one of these ids
export async function fetchLoanStages() {
  return apiRequest('/api/loans/stages/')
}

export async function updateLoan(id, payload) {
  return apiRequest(`/api/loans/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function updateOpportunity(opportunityId, payload) {
  return apiRequest(`/crm/opportunities/${encodeURIComponent(opportunityId)}/`, {
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
