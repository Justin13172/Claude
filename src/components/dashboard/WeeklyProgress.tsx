'use client'

import { CompletedSession } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface DayInfo {
  date: Date
  dateStr: string   // YYYY-MM-DD
  label: string     // 周一 … 周日
  dayNum: number    // 1-31
  isToday: boolean
  hasSession: boolean
}

/** Returns the last 7 days ending today (oldest first). */
function buildWeekDays(completedDates: Set<string>): DayInfo[] {
  const today = new Date()
  const days: DayInfo[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      date: d,
      dateStr,
      label: DAY_LABELS[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 0,
      hasSession: completedDates.has(dateStr),
    })
  }
  return days
}

/** Calculate the current consecutive-day streak going back from today. */
function calcStreak(completedDates: Set<string>): number {
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (completedDates.has(dateStr)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

interface WeeklyProgressProps {
  sessions: CompletedSession[]
}

export function WeeklyProgress({ sessions }: WeeklyProgressProps) {
  const completedDates = new Set(
    sessions.map((s) => s.completedAt.split('T')[0]),
  )
  const days   = buildWeekDays(completedDates)
  const streak = calcStreak(completedDates)

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700">
          本周训练记录
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* 7-day strip */}
        <div className="flex items-end justify-between gap-1">
          {days.map((day) => (
            <div
              key={day.dateStr}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              {/* Day label */}
              <span
                className={cn(
                  'text-[10px] font-medium',
                  day.isToday ? 'text-blue-600' : 'text-gray-400',
                )}
              >
                {day.label}
              </span>

              {/* Circle indicator */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all',
                  day.hasSession
                    ? 'bg-blue-500 text-white shadow-sm'
                    : day.isToday
                      ? 'border-2 border-blue-400 bg-blue-50 text-blue-600'
                      : 'border border-gray-200 bg-gray-50 text-gray-400',
                )}
              >
                {day.hasSession ? '✓' : day.dayNum}
              </div>

              {/* Today label */}
              {day.isToday && (
                <span className="text-[9px] font-semibold text-blue-500">今天</span>
              )}
            </div>
          ))}
        </div>

        {/* Streak counter */}
        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 py-2">
          <span className="text-base">🔥</span>
          <span className="text-sm font-medium text-gray-600">
            连续训练{' '}
            <span className="font-bold text-orange-500">{streak}</span>{' '}
            天
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
