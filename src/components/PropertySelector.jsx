import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const loanStage = (loan) => loan.stageName || loan.status

export default function PropertySelector({ properties = [], selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (properties.length === 0) return null

  const label = selected
    ? `${selected.address ?? 'Loan'}${loanStage(selected) ? ` (${loanStage(selected)})` : ''}`
    : 'Select a loan'

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <span className="truncate">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {properties.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">
                {p.address ?? 'Loan'}
                {loanStage(p) ? ` (${loanStage(p)})` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
