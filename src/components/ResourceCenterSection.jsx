import {
  BookOpen,
  Hammer,
  Building2,
  Briefcase,
  Percent,
  KeyRound,
  HelpCircle,
  PlayCircle,
  ListChecks,
  ArrowRight,
} from 'lucide-react'
import { resourceCategories } from '../data/dashboardData'

const icons = {
  BookOpen,
  Hammer,
  Building2,
  Briefcase,
  Percent,
  KeyRound,
  HelpCircle,
  PlayCircle,
  ListChecks,
}

export default function ResourceCenterSection() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resourceCategories.map((category) => {
        const Icon = icons[category.icon]
        return (
          <button
            key={category.id}
            type="button"
            className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50 sm:p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-white">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">{category.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{category.description}</p>
            <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-700">
              Explore
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
