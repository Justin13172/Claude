'use client'

import Link from 'next/link'
import { CompletedSession } from '@/types'
import { METHOD_META, VERDICT_LABELS, formatDateTimeCN, formatDuration, cn } from '@/lib/utils'

// ─── Score bar (same as EvaluationPanel) ─────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 5) * 100
  const color =
    score >= 4 ? 'bg-green-500' :
    score >= 3 ? 'bg-yellow-500' :
    'bg-red-400'
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-600 w-6 text-right">{score}/5</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SessionDetailProps {
  session: CompletedSession
  /** When true, show the replay button */
  showReplay?: boolean
}

export function SessionDetail({ session, showReplay = true }: SessionDetailProps) {
  const meta = METHOD_META[session.method]
  const ref = session.referenceAnswer
  const eval_ = session.aiEvaluation
  const verdictMeta = eval_ ? VERDICT_LABELS[eval_.overallVerdict] : null

  return (
    <div className="space-y-6">
      {/* ── 基本信息 ── */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span>{meta?.icon ?? '📝'} {session.methodLabel}</span>
        <span>·</span>
        <span>{formatDateTimeCN(session.completedAt)}</span>
        <span>·</span>
        <span>用时 {formatDuration(session.durationSeconds)}</span>
        <span>·</span>
        <span>
          自评 {session.selfRating} 星
          {'★'.repeat(session.selfRating)}
          <span className="text-gray-200">{'★'.repeat(5 - session.selfRating)}</span>
        </span>
      </div>

      {/* ── 1. 训练题目 ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">训练题目</h3>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
            {session.scenarioText}
          </p>
          {session.questions?.length > 0 && (
            <div className="border-t border-gray-200 pt-3 space-y-1.5">
              {session.questions.map((q, i) => (
                <p key={i} className="text-sm font-medium text-gray-800">
                  {i + 1}. {q}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 2. 我的作答 ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">我的作答</h3>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
            {session.userAnswer || '（未作答）'}
          </p>
        </div>
      </section>

      {/* ── 3. 参考答案 ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">参考答案</h3>
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-5">
          {/* 框架 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">所用框架：</span>
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
              {ref.frameworkUsed}
            </span>
          </div>

          {/* 各章节 */}
          {ref.sections.map((sec, i) => (
            <div key={i} className="space-y-1.5">
              <h4 className="text-sm font-semibold text-gray-900">{sec.title}</h4>
              <p className="text-sm leading-relaxed text-gray-700">{sec.content}</p>
              {sec.whyThisMatters && (
                <p className="text-xs text-gray-500 italic border-l-2 border-blue-300 pl-3">
                  💡 为什么重要：{sec.whyThisMatters}
                </p>
              )}
            </div>
          ))}

          {/* 专家水准 */}
          {ref.whatGoodLooksLike && (
            <div className="rounded-lg bg-blue-100/60 p-3">
              <p className="text-xs font-semibold text-blue-700 mb-1">⭐ 专家水准</p>
              <p className="text-sm leading-relaxed text-gray-700">{ref.whatGoodLooksLike}</p>
            </div>
          )}

          {/* 常见错误 */}
          {ref.commonMistakes?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-600">常见错误</h4>
              <ul className="space-y-1">
                {ref.commonMistakes.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                    <span className="text-gray-700">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 延伸阅读 */}
          {ref.furtherReading?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800">延伸阅读</h4>
              <div className="space-y-3">
                {ref.furtherReading.map((item, i) => {
                  const href = item.url ??
                    `https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + item.author)}`
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">📖</span>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-blue-600 hover:underline underline-offset-2"
                          >
                            {item.title}
                          </a>
                          {item.author && (
                            <span className="text-xs text-gray-400">— {item.author}</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs leading-relaxed text-gray-600">{item.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. AI 评估 ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">AI 评估</h3>
        {eval_ ? (
          <div className="space-y-4">
            {/* 整体评级 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex flex-wrap items-start gap-3">
                {verdictMeta && (
                  <span className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-sm font-bold',
                    verdictMeta.color
                  )}>
                    {verdictMeta.label}
                  </span>
                )}
                <p className="text-sm leading-relaxed text-gray-700 flex-1">
                  {eval_.overallSummary}
                </p>
              </div>
            </div>

            {/* 各维度评分 */}
            <div className="rounded-xl border border-gray-100 bg-white divide-y">
              {eval_.dimensions.map((dim, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-800">{dim.name}</span>
                    <ScoreBar score={dim.score} />
                  </div>
                  <p className="text-sm text-gray-600 leading-snug">{dim.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
            本次训练未进行 AI 评估
          </div>
        )}
      </section>

      {/* ── 5. 复盘笔记 ── */}
      {session.retrospectiveNote && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">复盘笔记</h3>
          <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {session.retrospectiveNote}
            </p>
          </div>
        </section>
      )}

      {/* ── 6. 再练此题 ── */}
      {showReplay && (
        <Link
          href={`/session/${session.method}?replay=${session.id}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
        >
          🔄 用此题再练一次
        </Link>
      )}
    </div>
  )
}
