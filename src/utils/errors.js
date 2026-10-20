// DRF returns { field: [messages] }; show the first one with its field name
export function errorMessage(err) {
  const data = err?.data
  if (data && typeof data === 'object' && !data.detail && !data.error) {
    const [field, messages] = Object.entries(data)[0] ?? []
    const message = Array.isArray(messages) ? messages[0] : messages
    if (message) return field === 'non_field_errors' ? message : `${field.replace(/_/g, ' ')}: ${message}`
  }
  return err?.message || 'Request failed'
}
