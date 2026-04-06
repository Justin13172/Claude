'use client'

import { useEffect, useState } from 'react'
import { getSessions, getTodayCompletedMethods } from '@/lib/storage'
import { getTodaySchedule } from '@/lib/schedule'
import { CompletedSession, MethodId, TodaySchedule } from '@/types'
import { TodayCard }       from '@/components/dashboard/TodayCard'
import { WeeklyProgress }  from '@/components/dashboard/WeeklyProgress'
import { MethodCoverage }  from '@/components/dashboard/MethodCoverage'
import { RecentSessions }  from '@/components/dashboard/RecentSessions'

export function Dashboard() {
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule | null>(null)
  const [sessions,      setSessions]      = useState<CompletedSession[]>([])
  const [loaded,        setLoaded]        = useState(false)

  useEffect(() => {
    const schedule = getTodaySchedule()
    const allSessions = getSessions()
    setTodaySchedule(schedule)
    setSessions(allSessions)
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

      {/* 2. Two-column: weekly progress + method coverage */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <WeeklyProgress sessions={sessions} />
        <MethodCoverage sessions={sessions} />
      </div>

      {/* 3. Recent sessions — full width */}
      <RecentSessions sessions={sessions} />
    </div>
  )
}
