export function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-slate-900">{children || '—'}</dd>
    </div>
  )
}

export function DetailGroup({ title, children }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <dl className="mt-2 divide-y divide-slate-100">{children}</dl>
    </section>
  )
}
