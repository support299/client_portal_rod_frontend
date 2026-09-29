import { CircleCheck, AlertTriangle, UserRoundCheck } from 'lucide-react'
import { dealHealthConfig } from '../common/constants/uiStyles'

const icons = {
  CircleCheck,
  AlertTriangle,
  UserRoundCheck,
}

const sizes = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1.5 text-xs',
}

export default function DealHealthBadge({ health, size = 'md', className = '' }) {
  if (!health) return null
  const config = dealHealthConfig[health]
  if (!config) return null

  const Icon = icons[config.icon]

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${sizes[size]} ${config.classes} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {health}
    </span>
  )
}
