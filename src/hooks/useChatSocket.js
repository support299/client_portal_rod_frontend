import { useEffect, useRef } from 'react'
import { API_URL } from '../api/client'
import { fetchMe } from '../api/auth'
import { getAccessToken } from '../common/auth/tokenStorage'

const WS_URL = API_URL.replace(/^http/, 'ws')
const MAX_DELAY = 30000

// One connection per tab, shared by every component using the hook (the chat panel and the
// notification bell). It opens with the first subscriber and closes with the last.
const subscribers = new Set()
let socket = null
let timer = null
let delay = 1000
let everOpened = false

function connect() {
  timer = null
  const token = getAccessToken()
  if (!subscribers.size || !token) return
  let opened = false
  const ws = new WebSocket(`${WS_URL}/ws/chats/?token=${encodeURIComponent(token)}`)
  socket = ws

  ws.onopen = () => {
    opened = true
    delay = 1000
    const reconnected = everOpened
    everOpened = true
    subscribers.forEach((s) => s.current.onOpen?.(reconnected))
  }

  ws.onmessage = (e) => {
    let event
    try {
      event = JSON.parse(e.data)
    } catch {
      return
    }
    subscribers.forEach((s) => s.current.onEvent?.(event))
  }

  ws.onclose = async () => {
    if (socket !== ws || !subscribers.size) return
    socket = null
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

function subscribe(handlers) {
  subscribers.add(handlers)
  if (!socket && !timer) connect()
}

function unsubscribe(handlers) {
  subscribers.delete(handlers)
  if (subscribers.size) return
  clearTimeout(timer)
  timer = null
  const ws = socket
  socket = null
  everOpened = false
  delay = 1000
  ws?.close()
}

/**
 * Passes every server event on /ws/chats/ (chat messages, notifications, ...) to onEvent.
 * Reconnects with backoff; onOpen(reconnected) lets the caller re-sync what it missed.
 * Sending goes through the REST API, so this socket only receives.
 */
export function useChatSocket({ onEvent, onOpen }) {
  const handlers = useRef({ onEvent, onOpen })

  useEffect(() => {
    handlers.current = { onEvent, onOpen }
  })

  useEffect(() => {
    subscribe(handlers)
    return () => unsubscribe(handlers)
  }, [])
}
