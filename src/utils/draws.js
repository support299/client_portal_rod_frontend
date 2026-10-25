import { drawStatusStyles } from '../common/constants/uiStyles'

// Draw amounts arrive as decimal strings, e.g. "26000.00"; null shows as a dash
export const money = (value) =>
  value == null || value === ''
    ? '—'
    : Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

export const drawStatusLabel = (status) => drawStatusStyles[status]?.[0] ?? status
