import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Pencil, Plus, Upload, X } from 'lucide-react'
import {
  createDocumentType,
  deactivateDocumentType,
  fetchDocumentTypes,
  fetchDocumentTypeTemplate,
  openBlob,
  updateDocumentType,
} from '../../api/documents'
import { useAuth } from '../../common/auth/AuthContext'
import { errorMessage } from '../../utils/errors'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none'

const emptyForm = { name: '', category: '', kind: 'upload', description: '', is_default: false, position: 0, is_active: true }

function formFromType(type) {
  return type
    ? {
        name: type.name,
        category: type.category,
        kind: type.kind,
        description: type.description,
        is_default: type.is_default,
        position: type.position,
        is_active: type.is_active,
      }
    : emptyForm
}

function TypeModal({ type, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() => formFromType(type))
  const [template, setTemplate] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef(null)

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && !saving && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  function handleChange(e) {
    const { name, value, type: inputType, checked } = e.target
    setForm((f) => ({ ...f, [name]: inputType === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      position: Number(form.position) || 0,
      template_file: form.kind === 'fill_form' ? template : null,
    }
    try {
      const saved = type ? await updateDocumentType(type.id, payload) : await createDocumentType(payload)
      onSaved(saved)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => !saving && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={type ? `Edit ${type.name}` : 'New document type'}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900">{type ? `Edit ${type.name}` : 'New document type'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label htmlFor="type-name" className="text-xs font-medium text-slate-500">Name</label>
            <input id="type-name" name="name" required value={form.name} onChange={handleChange} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type-category" className="text-xs font-medium text-slate-500">Category</label>
              <input
                id="type-category"
                name="category"
                list="type-categories"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Income, Property"
                className={inputClass}
              />
              <datalist id="type-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="type-position" className="text-xs font-medium text-slate-500">Order in category</label>
              <input
                id="type-position"
                name="position"
                type="number"
                min="0"
                value={form.position}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="type-kind" className="text-xs font-medium text-slate-500">Borrower should</label>
            <select id="type-kind" name="kind" value={form.kind} onChange={handleChange} className={inputClass}>
              <option value="upload">Upload their own file</option>
              <option value="fill_form">Fill in a form we share</option>
            </select>
          </div>
          {form.kind === 'fill_form' && (
            <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3">
              <p className="text-xs font-medium text-slate-600">Blank form</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {template || type?.has_template ? 'Replace form' : 'Upload form'}
                </button>
                <span className="text-xs text-slate-600">
                  {template?.name ?? (type?.has_template ? type.template_name : 'None yet')}
                </span>
                <input
                  ref={fileInput}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    setTemplate(e.target.files?.[0] ?? null)
                    e.target.value = ''
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Shared with the borrower whenever this type is requested.</p>
            </div>
          )}
          <div>
            <label htmlFor="type-desc" className="text-xs font-medium text-slate-500">Default instructions for the borrower</label>
            <textarea id="type-desc" name="description" rows={3} value={form.description} onChange={handleChange} className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_default"
                checked={form.is_default}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                Checklist item
                <span className="block text-xs text-slate-400">Requested automatically when a new loan is created.</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Active
            </label>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : type ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function DocumentTypesSection() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [types, setTypes] = useState([])
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // a type, 'new', or null

  const load = useCallback(() => {
    setLoading(true)
    fetchDocumentTypes(showInactive ? {} : { active: 'true' })
      .then((data) => setTypes(data ?? []))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [showInactive])

  useEffect(() => {
    load()
  }, [load])

  async function deactivate(type) {
    if (!window.confirm(`Deactivate ${type.name}? Existing requests keep it; it can't be requested anymore.`)) return
    try {
      await deactivateDocumentType(type.id)
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function openTemplate(type) {
    try {
      openBlob(await fetchDocumentTypeTemplate(type.id))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const categories = [...new Set(types.map((t) => t.category || 'Other'))]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Show inactive
        </label>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New document type
          </button>
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading && types.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Loading document types…</p>
      ) : types.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No document types yet.{isAdmin && ' Create one to start requesting documents from borrowers.'}
        </p>
      ) : (
        <div className="mt-4 space-y-6">
          {categories.map((category) => (
            <section key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{category}</h3>
              <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {types
                  .filter((t) => (t.category || 'Other') === category)
                  .map((type) => (
                    <li key={type.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${type.is_active ? '' : 'opacity-60'}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{type.name}</p>
                          {type.kind === 'fill_form' && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">Form</span>
                          )}
                          {type.is_default && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Checklist</span>
                          )}
                          {!type.is_active && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Inactive</span>
                          )}
                        </div>
                        {type.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{type.description}</p>}
                        {type.kind === 'fill_form' &&
                          (type.has_template ? (
                            <button
                              type="button"
                              onClick={() => openTemplate(type)}
                              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {type.template_name}
                            </button>
                          ) : (
                            <p className="mt-1 text-xs text-amber-700">No blank form uploaded.</p>
                          ))}
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditing(type)}
                            aria-label={`Edit ${type.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {type.is_active && (
                            <button
                              type="button"
                              onClick={() => deactivate(type)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <TypeModal
          type={editing === 'new' ? null : editing}
          categories={categories.filter((c) => c !== 'Other')}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}
