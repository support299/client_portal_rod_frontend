import { apiRequest } from './client'

// The user's own notifications, newest first: { results, next, count, unread_count }.
// params: unread ('true'), kind, loan, page, page_size
export async function fetchNotifications(params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  return apiRequest(`/api/notifications/?${query}`)
}

export async function fetchUnreadCount() {
  return apiRequest('/api/notifications/unread-count/')
}

// Both return { unread_count }
export async function markNotificationRead(id) {
  return apiRequest(`/api/notifications/${id}/read/`, { method: 'POST', body: '{}' })
}

export async function markAllNotificationsRead() {
  return apiRequest('/api/notifications/read-all/', { method: 'POST', body: '{}' })
}
