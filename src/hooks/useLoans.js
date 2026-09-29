import { useCallback, useEffect, useState } from 'react'
import { fetchLoanDetail, fetchMyLoans } from '../api/loans'

export function useMyLoans() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchMyLoans()
      setLoans(data.loans || [])
    } catch (err) {
      setError(err.message || 'Failed to load loans')
      setLoans([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { loans, loading, error, reload }
}

export function useLoanDetail(opportunityId) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!opportunityId) {
        setDetail(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const data = await fetchLoanDetail(opportunityId)
        if (!cancelled) setDetail(data)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load loan')
          setDetail(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [opportunityId])

  return { detail, loading, error }
}
