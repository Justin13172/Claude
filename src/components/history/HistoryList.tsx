'use client'

import { useState } from 'react'
import { CompletedSession } from '@/types'
import { formatDateCN, formatDuration, METHOD_META } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const VERDICT_STYLE: Record<string, string> = {
  strength:   'border-green-200  bg-green-50  text-green-700',
  developing: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  gap:        'border-red-200    bg-red-50    text-red-700',
}
const VERDICT_LABEL: Record<string, string> = {
  strength:   '优势项',
  developing: '发展中',
  gap:        '待提升',
}

function StarRating({ rating }: { rating: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="text-sm" aria-label={`自评${rating}星`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

/** Format a YYYY-MM completedAt prefix into "YYYY年M月" */
function toMonthLabel(isoDate: string): string {
  const [year, month] = isoDate.split('T')[0].split('-')
  return `${year}年${parseInt(month, 10)}月`
}

/** Group sessions by calendar month, sorted newest first. */
function groupByMonth(sessions: CompletedSession[]): { label: string; items: CompletedSession[] }[] {
  const sorted = [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  const map = new Map<string, CompletedSession[]>()

  for (const s of sorted) {
    const key = s.completedAt.slice(0, 7) // "YYYY-MM"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }

  return Array.from(map.entries()).map(([key, items]) => ({
    label: toMonthLabel(key + '-01T00:00:00'),
    items,
  }))
}

// ─── Expandable session row ───────────────────────────────────────────────────

function SessionRow({ session }: { session: CompletedSession }) {
  const [expanded, setExpanded] = useState(false)
  const meta    = METHOD_META[session.method]
  const verdict = session.aiEvaluation?.overallVerdict

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-100 bg-white transition-shadow',
        expanded ? 'shadow-md' : 'shadow-sm hover:shadow-md',
      )}
    >
      {/* Summary row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full flex-col gap-2 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
        aria-expanded={expanded}
      >
        {/* Left */}
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="mt-0.5 flex-shrink-0 text-xl leading-none sm:mt-0">
            {meta?.icon ?? '📝'}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[11px] text-gray-400">
              {formatDateCN(session.completedAt)}
            </span>
            <span className="truncate text-sm font-medium text-gray-800">
              {session.methodLabel} · {session.scenarioTitle}
            </span>
          </div>
        </div>

        {/* Right: rating / verdict / duration / chevron */}
        <div className="flex flex-shrink-0 items-center gap-2 pl-0 sm:pl-4">
          <StarRating rating={session.selfRating} />
          {verdict && (
            <Badge
              variant="outline"
              className={cn('text-[10px]', VERDICT_STYLE[verdict])}
            >
              {VERDICT_LABEL[verdict]}
            </Badge>
          )}
          <span className="hidden text-[11px] text-gray-400 sm:inline">
            {formatDuration(session.durationSeconds)}
          </span>
          <span
            className={cn(
              'text-gray-400 transition-transform duration-200',
              expanded ? 'rotate-180' : 'rotate-0',
            )}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="flex flex-col gap-5">
            {/* Duration (mobile) */}
            <p className="text-[11px] text-gray-400 sm:hidden">
              用时：{formatDuration(session.durationSeconds)}
            </p>

            {/* Scenario + questions */}
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                训练题目
              </h4>
              <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                <p className="text-sm leading-relaxed text-gray-600 line-clamp-4">
                  {session.scenarioText}
                </p>
                {session.questions && session.questions.length > 0 && (
                  <div className="border-t border-gray-200 pt-2 space-y-1">
                    {session.questions.map((q, i) => (
                      <p key={i} className="text-sm font-medium text-gray-700">
                        {i + 1}. {q}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* User answer */}
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                我的回答
              </h4>
              <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
                {session.userAnswer || '（未记录）'}
              </p>
            </section>

            {/* Reference answer summary */}
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                参考答案要点
              </h4>
              <div className="flex flex-col gap-2 rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-700">
                  框架：{session.referenceAnswer.frameworkUsed}
                </p>
                {session.referenceAnswer.sections.slice(0, 3).map((sec, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-gray-700">{sec.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{sec.content}</p>
                  </div>
                ))}
                {session.referenceAnswer.sections.length > 3 && (
                  <p className="text-[11px] text-gray-400">
                    …还有 {session.referenceAnswer.sections.length - 3} 个要点
                  </p>
                )}
              </div>
            </section>

            {/* AI evaluation */}
            {session.aiEvaluation ? (
              <section>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  AI 评估
                </h4>
                <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3">
                  {/* Overall */}
                  <div className="flex items-center gap-2">
                    {verdict && (
                      <Badge
                        variant="outline"
                        className={cn('text-[10px]', VERDICT_STYLE[verdict])}
                      >
                        {VERDICT_LABEL[verdict]}
                      </Badge>
                    )}
                    <p className="text-xs text-gray-600">
                      {session.aiEvaluation.overallSummary}
                    </p>
                  </div>
                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {session.aiEvaluation.dimensions.map((dim) => (
                      <div
                        key={dim.name}
                        className="rounded-md border border-gray-100 bg-white px-2 py-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-gray-700">
                            {dim.name}
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            {dim.score}/5
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-gray-400 line-clamp-2">
                          {dim.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <p className="text-xs text-gray-400">暂无 AI 评估</p>
            )}

            {/* Retrospective note */}
            {session.retrospectiveNote && (
              <section>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  复盘笔记
                </h4>
                <p className="whitespace-pre-wrap rounded-lg bg-yellow-50 p-3 text-sm leading-relaxed text-gray-700">
                  {session.retrospectiveNote}
                </p>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface HistoryListProps {
  sessions: CompletedSession[]
}

export function HistoryList({ sessions }: HistoryListProps) {
  const [page, setPage] = useState(1)

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-gray-400">
        <span className="text-5xl">📭</span>
        <p className="text-base">还没有训练记录</p>
        <p className="text-sm">完成第一次训练后，记录会显示在这里</p>
      </div>
    )
  }

  // Sort newest first, then paginate BEFORE grouping so groups respect the page slice
  const sorted = [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageSessions = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const groups = groupByMonth(pageSessions)

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.label}>
          {/* Month header */}
          <h3 className="mb-3 text-sm font-semibold text-gray-500">{group.label}</h3>

          <div className="flex flex-col gap-2">
            {group.items.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </section>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← 上一页
          </Button>
          <span className="text-sm text-gray-500">
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一页 →
          </Button>
        </div>
      )}
    </div>
  )
}
