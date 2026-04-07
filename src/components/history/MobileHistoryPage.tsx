'use client'

import { useEffect, useState } from 'react'
import { getSessions, exportSessionsAsJSON } from '@/lib/storage'
import { CompletedSession } from '@/types'
import { METHOD_META, formatDateCN, formatDuration, VERDICT_LABELS, cn } from '@/lib/utils'
import Link from 'next/link'

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
      {/* 折叠态：始终可见 */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50"
      >
        {/* 方法 emoji */}
        <span className="flex-shrink-0 text-2xl leading-none">{meta?.icon ?? '📝'}</span>

        {/* 场景信息 */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[14px] font-medium leading-snug text-gray-800">
            {session.scenarioTitle}
          </span>
          <span className="text-[12px] text-gray-400">
            {meta?.shortLabel ?? session.methodLabel} · {formatDateCN(session.completedAt)}
          </span>
        </div>

        {/* 右侧：评分 + 展开箭头 */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className="text-[13px]">
            <StarRating rating={session.selfRating} />
          </span>
          <span
            className={cn(
              'text-gray-300 text-xs transition-transform duration-200',
              expanded ? 'rotate-180' : 'rotate-0',
            )}
          >
            ▾
          </span>
        </div>
      </button>

      {/* 展开态：详细内容 */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* 用时 */}
            <p className="text-[12px] text-gray-400">
              用时：{formatDuration(session.durationSeconds)}
            </p>

            {/* 训练题目 */}
            <section>
              <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                训练题目
              </h4>
              <div className="rounded-xl bg-gray-50 p-3 space-y-2">
                <p className="text-[13px] leading-relaxed text-gray-600 line-clamp-4">
                  {session.scenarioText}
                </p>
                {session.questions && session.questions.length > 0 && (
                  <div className="border-t border-gray-200 pt-2 space-y-1">
                    {session.questions.map((q, i) => (
                      <p key={i} className="text-[13px] font-medium text-gray-700">
                        {i + 1}. {q}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 我的作答 */}
            <section>
              <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                我的作答
              </h4>
              <p className="whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-[14px] leading-relaxed text-gray-700">
                {session.userAnswer || '（未记录）'}
              </p>
            </section>

            {/* 参考框架 */}
            <section>
              <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                参考框架
              </h4>
              <div className="flex flex-col gap-2 rounded-xl bg-blue-50 p-3">
                <p className="text-[13px] font-semibold text-blue-700">
                  {session.referenceAnswer.frameworkUsed}
                </p>
                {session.referenceAnswer.sections.slice(0, 3).map((sec, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <p className="text-[13px] font-medium text-gray-700">{sec.title}</p>
                    <p className="text-[12px] leading-snug text-gray-500 line-clamp-2">
                      {sec.content}
                    </p>
                  </div>
                ))}
                {session.referenceAnswer.sections.length > 3 && (
                  <p className="text-[11px] text-gray-400">
                    …还有 {session.referenceAnswer.sections.length - 3} 个要点
                  </p>
                )}
              </div>
            </section>

            {/* AI 评级 */}
            {session.aiEvaluation ? (
              <section>
                <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                  AI 评级
                </h4>
                <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3">
                  {/* 总体结论 */}
                  <div className="flex items-start gap-2">
                    {verdictStyle && (
                      <span
                        className={cn(
                          'flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          verdictStyle.color,
                        )}
                      >
                        {verdictStyle.label}
                      </span>
                    )}
                    <p className="text-[13px] leading-snug text-gray-600">
                      {session.aiEvaluation.overallSummary}
                    </p>
                  </div>
                  {/* 各维度 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {session.aiEvaluation.dimensions.map((dim) => (
                      <div
                        key={dim.name}
                        className="rounded-xl border border-gray-100 bg-white px-2.5 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium text-gray-700 truncate">
                            {dim.name}
                          </span>
                          <span className="ml-1 flex-shrink-0 text-[12px] font-bold text-gray-500">
                            {dim.score}/5
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-400 line-clamp-2">
                          {dim.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <p className="text-[12px] text-gray-400">暂无 AI 评估</p>
            )}

            {/* 复盘笔记 */}
            {session.retrospectiveNote ? (
              <section>
                <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                  复盘笔记
                </h4>
                <p className="whitespace-pre-wrap rounded-xl bg-yellow-50 p-3 text-[14px] leading-relaxed text-gray-700">
                  {session.retrospectiveNote}
                </p>
              </section>
            ) : null}
          </div>
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
