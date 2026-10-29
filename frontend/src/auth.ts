import type { Session } from './types'

const KEY = 'session'

// sessionStorage: la sesión se pierde al cerrar la pestaña
export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (new Date(s.expiresAt) <= new Date()) {
      sessionStorage.removeItem(KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

export function saveSession(s: Session) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* sin almacenamiento */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nada */
  }
}
