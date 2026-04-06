import { CompletedSession, StorageSchema, MethodId } from '@/types'

const SCHEMA_VERSION = 1
const KEYS = {
  sessions: 'pst_sessions',
  settings: 'pst_settings',
} as const

// SSR guard
function isClient(): boolean {
  return typeof window !== 'undefined'
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function getSessions(): CompletedSession[] {
  if (!isClient()) return []

  const raw = localStorage.getItem(KEYS.sessions)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as CompletedSession[]
  } catch {
    return []
  }
}

export function saveSession(session: CompletedSession): void {
  if (!isClient()) return

  const sessions = getSessions()
  sessions.push(session)
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions))
}

// ─── Derived queries ──────────────────────────────────────────────────────────

export function getTodayCompletedMethods(): Set<MethodId> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const sessions = getSessions()

  const methods = new Set<MethodId>()
  for (const session of sessions) {
    if (session.completedAt.startsWith(today)) {
      methods.add(session.method)
    }
  }
  return methods
}

export function getSessionsForMethod(method: MethodId): CompletedSession[] {
  return getSessions().filter((s) => s.method === method)
}

export function getSessionCount(): number {
  return getSessions().length
}

export function getCompletedSessionDates(): Set<string> {
  const sessions = getSessions()
  const dates = new Set<string>()
  for (const session of sessions) {
    // completedAt is an ISO datetime string; extract YYYY-MM-DD portion
    const date = session.completedAt.split('T')[0]
    if (date) dates.add(date)
  }
  return dates
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportSessionsAsJSON(): string {
  const sessions = getSessions()

  const exportData: StorageSchema = {
    sessions,
    lastUpdated: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
  }

  const json = JSON.stringify(exportData, null, 2)

  if (isClient()) {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `pst-sessions-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return json
}
