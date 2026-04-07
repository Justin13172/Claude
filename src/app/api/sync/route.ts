import { NextRequest, NextResponse } from 'next/server'
import { CompletedSession } from '@/types'

export const maxDuration = 30

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

function redisKey(syncId: string): string {
  return `pst:sessions:${syncId}`
}

async function redisGet(key: string): Promise<CompletedSession[] | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.result == null) return null
  try {
    return JSON.parse(data.result) as CompletedSession[]
  } catch {
    return null
  }
}

async function redisSet(key: string, value: CompletedSession[]): Promise<boolean> {
  if (!REDIS_URL || !REDIS_TOKEN) return false
  // Use SET with EX 90 days (7776000 seconds)
  const res = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: JSON.stringify(value), ex: 7776000 }),
  })
  return res.ok
}

// GET /api/sync?syncId=xxx → returns remote sessions
export async function GET(req: NextRequest) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return NextResponse.json({ error: '未配置同步服务，请联系管理员' }, { status: 503 })
  }

  const syncId = req.nextUrl.searchParams.get('syncId')
  if (!syncId || syncId.length < 8) {
    return NextResponse.json({ error: '无效的同步码' }, { status: 400 })
  }

  const remote = await redisGet(redisKey(syncId))
  return NextResponse.json({ sessions: remote ?? [] })
}

// POST /api/sync → merge local sessions with remote, return merged
export async function POST(req: NextRequest) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return NextResponse.json({ error: '未配置同步服务，请联系管理员' }, { status: 503 })
  }

  const { syncId, sessions } = await req.json() as {
    syncId: string
    sessions: CompletedSession[]
  }

  if (!syncId || syncId.length < 8) {
    return NextResponse.json({ error: '无效的同步码' }, { status: 400 })
  }

  const key = redisKey(syncId)
  const remote = await redisGet(key) ?? []

  // Merge: union by session ID, prefer local version for conflicts
  const merged = new Map<string, CompletedSession>()
  for (const s of remote) merged.set(s.id, s)
  for (const s of sessions) merged.set(s.id, s)  // local overwrites remote

  const mergedArr = Array.from(merged.values()).sort(
    (a, b) => b.completedAt.localeCompare(a.completedAt)
  )

  const saved = await redisSet(key, mergedArr)
  if (!saved) {
    return NextResponse.json({ error: '同步写入失败，请稍后重试' }, { status: 500 })
  }

  return NextResponse.json({ sessions: mergedArr, count: mergedArr.length })
}
