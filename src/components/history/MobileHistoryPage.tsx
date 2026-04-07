'use client'

import { useEffect, useState } from 'react'
import { getSessions, exportSessionsAsJSON } from '@/lib/storage'
import { CompletedSession } from '@/types'
import { METHOD_META, formatDateTimeCN, formatDuration, VERDICT_LABELS, cn } from '@/lib/utils'
import Link from 'next/link'
import { SessionDetail } from './SessionDetail'

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 将 sessions 按月分组，每组内按时间倒序 */
function groupByMonth(
  sessions: CompletedSession[],
): { label: string; items: CompletedSession[] }[] {
  const sorted = [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  const map = new Map<string, CompletedSession[]>()

  for (const s of sorted) {
    const key = s.completedAt.slice(0, 7) // "YYYY-MM"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }

  return Array.from(map.entries()).map(([key, items]) => {
    const [year, month] = key.split('-')
    return {
      label: `${year}年${parseInt(month, 10)}月`,
      items,
    }
  })
}

// ─── 星级评分 ─────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span aria-label={`自评${rating}星`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-200'}>
          ★
        </span>
      ))}
    </span>
  )
}

// ─── 导出按钮 ─────────────────────────────────────────────────────────────────

function ExportIconButton() {
  const [done, setDone] = useState(false)

  function handleExport() {
    exportSessionsAsJSON()
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      aria-label="导出训练记录"
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-colors active:scale-95',
        done
          ? 'border-green-200 bg-green-50 text-green-600'
          : 'border-gray-200 bg-white text-gray-500 active:bg-gray-100',
      )}
    >
      {done ? '✓' : '⬇'}
    </button>
  )
}

// ─── 单条记录（可展开卡片） ────────────────────────────────────────────────────

function SessionCard({ session }: { session: CompletedSession }) {
  const [expanded, setExpanded] = useState(false)
  const meta    = METHOD_META[session.method]
  const verdict = session.aiEvaluation?.overallVerdict

  const verdictStyle = verdict ? VERDICT_LABELS[verdict] : null

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white overflow-hidden transition-shadow',
        expanded ? 'shadow-md' : 'shadow-sm',
      )}
    >
      {/* 折叠态头部 */}
      <div className="flex min-h-[56px] items-center gap-3 px-4 py-3">
        {/* 点标题区跳转详情页 */}
        <Link
          href={`/history/${session.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 active:opacity-70"
        >
          <span className="flex-shrink-0 text-2xl leading-none">{meta?.icon ?? '📝'}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[14px] font-medium leading-snug text-gray-800">
              {session.scenarioTitle}
            </span>
            <span className="text-[12px] text-gray-400">
              {meta?.shortLabel ?? session.methodLabel} · {formatDateTimeCN(session.completedAt)}
            </span>
          </div>
        </Link>

        {/* 右侧：评分 + 展开箭头 */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className="text-[13px]">
            <StarRating rating={session.selfRating} />
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="p-1"
          >
            <span className={cn(
              'block text-gray-300 text-xs transition-transform duration-200',
              expanded ? 'rotate-180' : 'rotate-0',
            )}>▾</span>
          </button>
        </div>
      </div>

      {/* 展开态：使用完整 SessionDetail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4">
          <SessionDetail session={session} showReplay />
        </div>
      )}
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function MobileHistoryPage() {
  const [sessions, setSessions] = useState<CompletedSession[]>([])
  const [loaded,   setLoaded]   = useState(false)

  useEffect(() => {
    const all = getSessions()
    setSessions(all)
    setLoaded(true)
  }, [])

  if (!loaded) {
    return (
      <div className="flex flex-col gap-3 p-4 animate-pulse">
        <div className="h-14 rounded-2xl bg-gray-100" />
        <div className="h-10 w-24 rounded-lg bg-gray-100" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100" />
        ))}
      </div>
    )
  }

  const groups = groupByMonth(sessions)

  return (
    <div className="flex flex-col gap-3 p-4 pb-8">
      {/* 顶部栏：标题 + 总数 + 导出 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">训练记录</h1>
          <p className="text-[13px] text-gray-400">共 {sessions.length} 条记录</p>
        </div>
        <ExportIconButton />
      </div>

      {/* 空状态 */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <span className="text-5xl">📭</span>
          <div className="flex flex-col gap-1">
            <p className="text-[16px] font-semibold text-gray-600">
              还没有训练记录
            </p>
            <p className="text-[14px] text-gray-400">
              开始你的第一次训练吧！
            </p>
          </div>
          <Link
            href="/"
            className="mt-2 rounded-2xl bg-blue-500 px-6 py-3 text-[14px] font-semibold text-white shadow-md active:bg-blue-600 active:scale-95 transition-all"
          >
            去今日训练 →
          </Link>
        </div>
      ) : (
        /* 按月分组列表 */
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.label}>
              {/* 月份标题 */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[13px] font-semibold text-gray-500">
                  {group.label}
                </span>
                <span className="text-[11px] text-gray-300">
                  {group.items.length} 条
                </span>
              </div>

              {/* 该月所有记录 */}
              <div className="flex flex-col gap-2">
                {group.items.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
