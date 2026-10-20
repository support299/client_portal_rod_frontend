import { useEffect, useRef } from 'react'
import { API_URL } from '../api/client'
import { fetchMe } from '../api/auth'
import { getAccessToken } from '../common/auth/tokenStorage'

const WS_URL = API_URL.replace(/^http/, 'ws')
const MAX_DELAY = 30000

/**
 * Keeps one live connection to /ws/chats/ and passes every server event to onEvent.
 * Reconnects with backoff; onOpen(reconnected) lets the caller re-sync what it missed.
 * Sending goes through the REST API, so this socket only receives.
 */
export function useChatSocket({ onEvent, onOpen }) {
  const handlers = useRef({ onEvent, onOpen })

  useEffect(() => {
    handlers.current = { onEvent, onOpen }
  })

  useEffect(() => {
    let socket = null
    let timer = null
    let stopped = false
    let delay = 1000
    let everOpened = false

    function connect() {
      const token = getAccessToken()
      if (stopped || !token) return
      let opened = false
      socket = new WebSocket(`${WS_URL}/ws/chats/?token=${encodeURIComponent(token)}`)

      socket.onopen = () => {
        opened = true
        delay = 1000
        handlers.current.onOpen?.(everOpened)
        everOpened = true
      }

      socket.onmessage = (e) => {
        let event
        try {
          event = JSON.parse(e.data)
        } catch {
          return
        }
        handlers.current.onEvent?.(event)
      }

      socket.onclose = async () => {
        if (stopped) return
        if (!opened) {
          // Usually an expired access token: an authenticated call refreshes it.
          try {
            await fetchMe()
          } catch {
            return
          }
        }
        timer = setTimeout(connect, delay)
        delay = Math.min(delay * 2, MAX_DELAY)
      }
    }

    connect()
    return () => {
      stopped = true
      clearTimeout(timer)
      socket?.close()
    }
  }, [])
}
