'use client'

import { useEffect, useState } from 'react'
import { getSessions, getTodayCompletedMethods } from '@/lib/storage'
import { getTodaySchedule } from '@/lib/schedule'
import { CompletedSession, MethodId, TodaySchedule } from '@/types'
import { METHOD_META } from '@/lib/utils'
import { TodayCard }       from '@/components/dashboard/TodayCard'
import { WeeklyProgress }  from '@/components/dashboard/WeeklyProgress'
import { MethodCoverage }  from '@/components/dashboard/MethodCoverage'
import { RecentSessions }  from '@/components/dashboard/RecentSessions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SyncPanel } from '@/components/sync/SyncPanel'
import Link from 'next/link'

const ALL_METHODS: MethodId[] = [
  'requirement-translation',
  'product-teardown',
  'roadmap-decisions',
  'judgment-review',
  'raw-user-data',
  'learning-process',
]

function AllMethodsCard({ todayCompleted }: { todayCompleted: Set<MethodId> }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">全部训练方法</CardTitle>
        <p className="text-sm text-gray-500">每个方法每天可以反复练习</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_METHODS.map((id) => {
            const meta = METHOD_META[id]
            const done = todayCompleted.has(id)
            return (
              <Link
                key={id}
                href={`/session/${id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">{meta.icon}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-gray-800">{meta.shortLabel}</span>
                  {done ? (
                    <span className="text-xs text-green-500 font-medium">✓ 今日已练</span>
                  ) : (
                    <span className="text-xs text-gray-400">开始训练 →</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const [todaySchedule,  setTodaySchedule]  = useState<TodaySchedule | null>(null)
  const [sessions,       setSessions]       = useState<CompletedSession[]>([])
  const [todayCompleted, setTodayCompleted] = useState<Set<MethodId>>(new Set())
  const [loaded,         setLoaded]         = useState(false)

  useEffect(() => {
    const schedule    = getTodaySchedule()
    const allSessions = getSessions()
    const completed   = getTodayCompletedMethods()
    setTodaySchedule(schedule)
    setSessions(allSessions)
    setTodayCompleted(completed)
    setLoaded(true)
  }, [])

  // Loading skeleton
  if (!loaded) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* TodayCard skeleton */}
        <div className="h-28 rounded-xl bg-gray-100" />
        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="h-48 rounded-xl bg-gray-100" />
          <div className="h-48 rounded-xl bg-gray-100" />
        </div>
        {/* RecentSessions skeleton */}
        <div className="h-40 rounded-xl bg-gray-100" />
      </div>
    )
  }

  // todaySchedule is always set after load (getTodaySchedule never returns null)
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Today's training card — full width */}
      {todaySchedule && <TodayCard schedule={todaySchedule} />}

      {/* 2. All methods grid */}
      <AllMethodsCard todayCompleted={todayCompleted} />

      {/* 3. Two-column: weekly progress + method coverage */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <WeeklyProgress sessions={sessions} />
        <MethodCoverage sessions={sessions} />
      </div>

      {/* 4. Recent sessions — full width */}
      <RecentSessions sessions={sessions} />

      {/* 5. Cross-device sync */}
      <SyncPanel onSynced={(merged) => setSessions(merged)} />
    </div>
  )
}
