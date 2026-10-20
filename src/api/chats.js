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

// Loan chats only: send a file (stored as one of the loan's documents), with an optional message
// body; pass request (a document request id) when the file answers a request
export async function sendChatFile(chatId, { file, body, request }) {
  const form = new FormData()
  form.append('file', file)
  if (body) form.append('body', body)
  if (request != null) form.append('request', request)
  return apiRequest(`/api/chats/${chatId}/attachments/`, { method: 'POST', body: form })
}

// Staff, loan chats only: request a document; returns the posted document_request message.
// payload as for createDocumentRequest (form_file may be a File)
export async function requestDocumentInChat(chatId, payload) {
  const fields = Object.entries(payload).filter(([, v]) => v != null)
  const hasFile = fields.some(([, v]) => v instanceof File)
  const form = new FormData()
  fields.forEach(([k, v]) => form.append(k, v))
  return apiRequest(`/api/chats/${chatId}/document-requests/`, {
    method: 'POST',
    body: hasFile ? form : JSON.stringify(Object.fromEntries(fields)),
  })
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
