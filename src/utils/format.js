export const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function formatDate(value, withTime = false) {
  if (!value) return null
  // Date-only strings (YYYY-MM-DD) parse as UTC; pin them to local midnight
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime && { hour: 'numeric', minute: '2-digit' }),
  })
}

// "5m ago", "3h ago", "2d ago", then the date
export function timeAgo(value) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h ago`
  if (minutes < 7 * 24 * 60) return `${Math.round(minutes / (24 * 60))}d ago`
  return formatDate(value)
}

// GHL stores the value under a type-specific key (fieldValueString, fieldValueNumber, …)
export function customFieldValue(field) {
  const key = Object.keys(field).find((k) => k.startsWith('fieldValue') || k === 'value')
  const value = key ? field[key] : null
  if (value == null || value === '') return null
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
