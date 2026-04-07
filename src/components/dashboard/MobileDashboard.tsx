'use client'

import { useEffect, useState } from 'react'
import { getSessions, getTodayCompletedMethods, getCompletedSessionDates } from '@/lib/storage'
import { getTodaySchedule } from '@/lib/schedule'
import { METHOD_META, formatDuration, formatDateCN, cn } from '@/lib/utils'
import { CompletedSession, MethodId, TodaySchedule } from '@/types'
import Link from 'next/link'

// ─── 方法颜色映射 ─────────────────────────────────────────────────────────────

const METHOD_GRADIENT: Record<MethodId, string> = {
  'requirement-translation': 'from-blue-500 to-blue-700',
  'product-teardown':        'from-purple-500 to-purple-700',
  'roadmap-decisions':       'from-orange-500 to-orange-700',
  'judgment-review':         'from-green-500 to-green-700',
  'raw-user-data':           'from-red-500 to-red-700',
  'learning-process':        'from-yellow-400 to-yellow-600',
}

const METHOD_BTN_TEXT: Record<MethodId, string> = {
  'requirement-translation': 'text-blue-600',
  'product-teardown':        'text-purple-600',
  'roadmap-decisions':       'text-orange-600',
  'judgment-review':         'text-green-600',
  'raw-user-data':           'text-red-600',
  'learning-process':        'text-yellow-600',
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 过去7天（最旧→最新），含今日 */
function buildLast7Days(): { dateStr: string; isToday: boolean }[] {
  const today = new Date()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push({
      dateStr: d.toISOString().split('T')[0],
      isToday: i === 0,
    })
  }
  return days
}

/** 连续打卡天数（从今天往前算） */
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

const METHOD_IDS: MethodId[] = [
  'requirement-translation',
  'product-teardown',
  'roadmap-decisions',
  'judgment-review',
  'raw-user-data',
  'learning-process',
]

// ─── 子组件 ───────────────────────────────────────────────────────────────────

/** 今日训练英雄卡 */
function HeroCard({ schedule }: { schedule: TodaySchedule }) {
  const gradient = METHOD_GRADIENT[schedule.method] ?? 'from-gray-500 to-gray-700'
  const btnText  = METHOD_BTN_TEXT[schedule.method]  ?? 'text-gray-600'

  return (
    <div className={cn('relative rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg', gradient)}>
      {/* 背景装饰圆 */}
      <div className="pointer-events-none absolute right-4 top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-4">
        {/* 顶部行：badge */}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            今日训练
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur-sm">
            ⏱ 约 {schedule.estimatedMinutes} 分钟
          </span>
        </div>

        {/* 中部：emoji + 方法名 + 描述 */}
        <div className="flex items-center gap-4">
          <span className="text-6xl leading-none drop-shadow">{schedule.icon}</span>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold leading-tight">{schedule.methodLabel}</h2>
            <p className="text-sm text-white/80">{schedule.methodDescription}</p>
            <p className="text-xs text-white/60">{schedule.sessionContext}</p>
          </div>
        </div>

        {/* 底部：完成状态 or 开始按钮 */}
        {schedule.isCompleted ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 backdrop-blur-sm">
              <span className="text-lg">✅</span>
              <span className="text-sm font-semibold">今日已完成</span>
            </div>
            <Link
              href={`/session/${schedule.method}`}
              className="rounded-xl border border-white/50 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm active:bg-white/20 transition-colors"
            >
              再练一次 →
            </Link>
          </div>
        ) : (
          <Link
            href={`/session/${schedule.method}`}
            className={cn(
              'self-start rounded-xl bg-white px-6 py-3 text-sm font-bold shadow-md active:scale-95 transition-transform',
              btnText,
            )}
          >
            开始训练 →
          </Link>
        )}
      </div>
    </div>
  )
}

/** 连续打卡条 */
function StreakBar({ sessions }: { sessions: CompletedSession[] }) {
  const completedDates = new Set(sessions.map((s) => s.completedAt.split('T')[0]))
  const streak = calcStreak(completedDates)
  const days   = buildLast7Days()

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* 连续天数 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🔥</span>
          <span className="text-sm font-semibold text-gray-700">
            连续 <span className="text-orange-500">{streak}</span> 天
          </span>
        </div>

        {/* 7天点阵 */}
        <div className="flex items-center gap-1.5">
          {days.map((day) => {
            const has = completedDates.has(day.dateStr)
            return (
              <div
                key={day.dateStr}
                className={cn(
                  'h-3 w-3 rounded-full transition-all',
                  has
                    ? 'bg-blue-500 shadow-sm'
                    : day.isToday
                      ? 'border-2 border-blue-400 bg-blue-50'
                      : 'border border-gray-200 bg-gray-100',
                )}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** 方法覆盖快览（6个方法，2列网格） */
function MethodGrid({ sessions }: { sessions: CompletedSession[] }) {
  const counts: Record<MethodId, number> = {
    'requirement-translation': 0,
    'product-teardown':        0,
    'roadmap-decisions':       0,
    'judgment-review':         0,
    'raw-user-data':           0,
    'learning-process':        0,
  }
  for (const s of sessions) {
    counts[s.method] = (counts[s.method] ?? 0) + 1
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-600">方法覆盖</h3>
      <div className="grid grid-cols-2 gap-2">
        {METHOD_IDS.map((id) => {
          const meta  = METHOD_META[id]
          const count = counts[id]
          const hasRecord = count > 0

          return (
            <div
              key={id}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors',
                hasRecord
                  ? 'bg-gray-50'
                  : 'bg-gray-50/50 opacity-70',
              )}
            >
              <span className="text-xl leading-none">{meta.icon}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    'truncate text-xs font-medium',
                    hasRecord ? 'text-gray-800' : 'text-gray-400',
                  )}
                >
                  {meta.shortLabel}
                </span>
                {hasRecord ? (
                  <span className="text-[10px] text-gray-400">{count} 次</span>
                ) : (
                  <span className="text-[10px] text-orange-400">⚠️ 未练习</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 全部训练方法入口（可随时训练） */
function AllMethodsGrid({ todayCompleted }: { todayCompleted: Set<MethodId> }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-600">全部训练方法</h3>
      <div className="grid grid-cols-2 gap-2">
        {METHOD_IDS.map((id) => {
          const meta = METHOD_META[id]
          const done = todayCompleted.has(id)
          return (
            <Link
              key={id}
              href={`/session/${id}`}
              className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-3 active:bg-gray-100 transition-colors"
            >
              <span className="text-2xl leading-none flex-shrink-0">{meta.icon}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium text-gray-800">{meta.shortLabel}</span>
                {done ? (
                  <span className="text-[10px] text-green-500 font-medium">✓ 今日已练</span>
                ) : (
                  <span className="text-[10px] text-gray-400">点击开始训练</span>
                )}
              </div>
              <span className="text-gray-300 text-xs flex-shrink-0">›</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** 最近3条记录 */
function RecentRecords({ sessions }: { sessions: CompletedSession[] }) {
  const recent = [...sessions]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 3)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600">最近记录</h3>
        <Link
          href="/history"
          className="text-xs font-medium text-blue-500 active:text-blue-700"
        >
          全部 →
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">暂无记录</p>
      ) : (
        <div className="flex flex-col gap-2">
          {recent.map((session) => {
            const meta = METHOD_META[session.method]
            return (
              <Link
                key={session.id}
                href="/history"
                className="flex min-h-[56px] items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 active:bg-gray-100 transition-colors"
              >
                <span className="flex-shrink-0 text-2xl leading-none">{meta?.icon ?? '📝'}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-gray-800">
                    {session.scenarioTitle}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {formatDateCN(session.completedAt)}
                  </span>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                  <span className="text-sm text-yellow-400">
                    {'★'.repeat(session.selfRating)}
                    <span className="text-gray-200">{'★'.repeat(5 - session.selfRating)}</span>
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatDuration(session.durationSeconds)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function MobileDashboard() {
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

  if (!loaded) {
    return (
      <div className="flex flex-col gap-3 p-4 animate-pulse">
        <div className="h-52 rounded-2xl bg-gray-200" />
        <div className="h-12 rounded-2xl bg-gray-100" />
        <div className="h-44 rounded-2xl bg-gray-100" />
        <div className="h-40 rounded-2xl bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-8">
      {/* 1. 今日训练英雄卡 */}
      {todaySchedule && <HeroCard schedule={todaySchedule} />}

      {/* 2. 连续打卡条 */}
      <StreakBar sessions={sessions} />

      {/* 3. 全部训练方法入口 */}
      <AllMethodsGrid todayCompleted={todayCompleted} />

      {/* 4. 连续打卡 + 方法覆盖 */}
      <StreakBar sessions={sessions} />
      <MethodGrid sessions={sessions} />

      {/* 5. 最近3条记录 */}
      <RecentRecords sessions={sessions} />
    </div>
  )
}
