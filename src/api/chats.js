import { apiRequest } from './client'

function queryString(params) {
  return new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

function postJson(path, body = {}) {
  return apiRequest(path, { method: 'POST', body: JSON.stringify(body) })
}

// The inbox: loan chats, groups and direct messages the user can see, newest activity first
export async function fetchChats(params = {}) {
  return apiRequest(`/api/chats/?${queryString(params)}`)
}

export async function fetchChat(chatId) {
  return apiRequest(`/api/chats/${chatId}/`)
}

// A loan's chat, created on first use
export async function fetchLoanChat(loanId) {
  return apiRequest(`/api/chats/loans/${loanId}/`)
}

// Oldest first; pass before (a message id) to page back. Returns { results, has_more }
export async function fetchMessages(chatId, { before, limit } = {}) {
  return apiRequest(`/api/chats/${chatId}/messages/?${queryString({ before, limit })}`)
}

export async function sendMessage(chatId, body) {
  return postJson(`/api/chats/${chatId}/messages/`, { body })
}

export async function markChatRead(chatId) {
  return postJson(`/api/chats/${chatId}/read/`)
}

// Returns the existing direct chat when there already is one
export async function startDirectChat(userId) {
  return postJson('/api/chats/', { kind: 'direct', user: userId })
}

export async function createGroupChat(name, memberIds) {
  return postJson('/api/chats/', { kind: 'group', name, members: memberIds })
}

export async function renameChat(chatId, name) {
  return apiRequest(`/api/chats/${chatId}/`, { method: 'PATCH', body: JSON.stringify({ name }) })
}

export async function addChatMembers(chatId, userIds) {
  return postJson(`/api/chats/${chatId}/members/`, { users: userIds })
}

// Remove someone from a group, or leave it with your own id
export async function removeChatMember(chatId, userId) {
  return apiRequest(`/api/chats/${chatId}/members/${userId}/`, { method: 'DELETE' })
}

// Staff the user can start a chat with (staff only)
export async function searchChatPeople(search) {
  return apiRequest(`/api/chats/people/?${queryString({ search })}`)
}

// The chat API reports failures as { error }, which apiRequest doesn't read
export function chatErrorText(err, fallback = 'Something went wrong') {
  return err?.data?.error || err?.data?.detail || err?.message || fallback
}
