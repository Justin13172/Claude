import { CompletedSession } from '@/types'

const SYNC_ID_KEY = 'pst_sync_id'

function isClient(): boolean {
  return typeof window !== 'undefined'
}

/** Get or generate this device's sync ID */
export function getSyncId(): string | null {
  if (!isClient()) return null
  return localStorage.getItem(SYNC_ID_KEY)
}

/** Save a sync ID (used when entering a code from another device) */
export function setSyncId(id: string): void {
  if (!isClient()) return
  localStorage.setItem(SYNC_ID_KEY, id)
}

/** Generate a new random sync code and persist it */
export function generateSyncId(): string {
  const id = Array.from(crypto.getRandomValues(new Uint8Array(5)))
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .slice(0, 8)
  setSyncId(id)
  return id
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface SyncResult {
  merged: CompletedSession[]
  addedLocally: number
  addedRemotely: number
}

/**
 * Push local sessions to remote and pull back the merged set.
 * Returns the fully merged session array to be stored locally.
 */
export async function syncSessions(
  syncId: string,
  localSessions: CompletedSession[],
): Promise<SyncResult> {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ syncId, sessions: localSessions }),
  })

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: '同步失败' }))
    throw new Error(error ?? '同步失败')
  }

  const { sessions: merged } = await res.json() as { sessions: CompletedSession[]; count: number }

  const localIds = new Set(localSessions.map(s => s.id))
  const addedLocally = merged.filter(s => !localIds.has(s.id)).length
  const remoteCount = merged.length - localSessions.length - addedLocally
  const addedRemotely = Math.max(0, remoteCount + addedLocally)

  return {
    merged,
    addedLocally,
    addedRemotely: merged.length - localSessions.length,
  }
}
