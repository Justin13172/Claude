'use client'

import { useState, useEffect, useRef } from 'react'
import { AIEvaluation } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn, VERDICT_LABELS } from '@/lib/utils'

// 5 格评分条
function ScoreBar({ score }: { score: number }) {
  const barColor =
    score >= 4 ? 'bg-green-500' : score === 3 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1">
        {([1, 2, 3, 4, 5] as const).map(n => (
          <div
            key={n}
            className={cn(
              'w-6 h-3 rounded-sm transition-colors',
              n <= score ? barColor : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      <span className="text-sm font-semibold tabular-nums text-gray-800">{score}/5</span>
    </div>
  )
}

interface MobileEvaluationPanelProps {
  evaluationText: string
  isStreaming: boolean
  onComplete: (evaluation: AIEvaluation, retrospectiveNote: string) => void
}

export function MobileEvaluationPanel({
  evaluationText,
  isStreaming,
  onComplete,
}: MobileEvaluationPanelProps) {
  const [parsedEval, setParsedEval] = useState<AIEvaluation | null>(null)
  const [parseError, setParseError] = useState(false)
  const [retrospectiveNote, setRetrospectiveNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const streamEndRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  // 尝试解析 JSON（streaming 完成后）
  useEffect(() => {
    if (isStreaming) return
    if (!evaluationText.trim()) return

    try {
      const jsonMatch =
        evaluationText.match(/```json\n?([\s\S]*?)\n?```/) ||
        evaluationText.match(/(\{[\s\S]*\})/)

      const rawJson = jsonMatch ? jsonMatch[1] : evaluationText.trim()
      const data = JSON.parse(rawJson) as AIEvaluation

      if (!Array.isArray(data.dimensions) || !data.overallVerdict) {
        throw new Error('格式不完整')
      }

      if (!data.generatedAt) data.generatedAt = new Date().toISOString()

      setParsedEval(data)
    } catch {
      setParseError(true)
    }
  }, [isStreaming, evaluationText])

  // 串流时自动滚动到底部
  useEffect(() => {
    if (isStreaming) {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [evaluationText, isStreaming])

  const handleComplete = () => {
    if (submitted) return
    setSubmitted(true)
    if (parsedEval) {
      onComplete(parsedEval, retrospectiveNote)
    }
  }

  const handleNoteFocus = () => {
    setTimeout(() => {
      noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }

  const verdictMeta = parsedEval
    ? VERDICT_LABELS[parsedEval.overallVerdict] ?? VERDICT_LABELS['developing']
    : null

  return (
    <div className="flex flex-col h-full">
      {/* 标题区 */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 text-center">
        <h2 className="text-lg font-bold text-gray-900">🤖 AI 深度评估</h2>
        {isStreaming && (
          <div className="mt-1 space-y-1">
            <p className="text-sm text-blue-500 animate-pulse">
              {evaluationText.length === 0 ? '正在连接 AI…' : `分析中… 已生成 ${evaluationText.length} 字`}
            </p>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden mx-8">
              <div
                className="h-full bg-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (evaluationText.length / 800) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* 串流中且尚无内容：显示等待动画 */}
        {isStreaming && evaluationText.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400">正在连接 AI，请稍候…</p>
          </div>
        )}

        {/* 串流中：显示原始文字 */}
        {(isStreaming || (!parsedEval && !parseError)) && evaluationText && (
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-gray-500 overflow-x-auto">
              {evaluationText}
            </pre>
            <div ref={streamEndRef} />
          </div>
        )}

        {/* 解析失败回退 */}
        {!isStreaming && parseError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-600">评估报告（原始格式）</p>
            <p className="text-xs text-gray-500">JSON 解析遇到问题，以下为原始评估文本：</p>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono bg-white rounded-lg p-3 overflow-x-auto text-gray-700">
              {evaluationText}
            </pre>
          </div>
        )}

        {/* 结构化评估结果 */}
        {!isStreaming && parsedEval && (
          <>
            {/* 总体评级 badge（大，居中） */}
            <div className="flex flex-col items-center gap-3 py-2">
              <span className="text-sm text-gray-400 font-medium">整体评级</span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-6 py-2 text-lg font-bold',
                  verdictMeta?.color
                )}
              >
                {verdictMeta?.label}
              </span>
              <p className="text-base leading-relaxed text-gray-700 text-center px-2">
                {parsedEval.overallSummary}
              </p>
            </div>

            {/* 各维度：名称 + 评分条 + 一句理由 */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                各维度评分
              </h3>
              <div className="rounded-xl border border-gray-100 bg-white overflow-hidden divide-y divide-gray-100">
                {parsedEval.dimensions.map((dim, i) => (
                  <div key={i} className="px-4 py-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-base text-gray-900">{dim.name}</span>
                      <ScoreBar score={dim.score} />
                    </div>
                    <p className="text-sm text-gray-500 leading-snug">{dim.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 复盘笔记（串流结束后显示） */}
        {!isStreaming && evaluationText && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              复盘笔记
            </h3>
            <Textarea
              ref={noteRef}
              value={retrospectiveNote}
              onChange={e => setRetrospectiveNote(e.target.value)}
              onFocus={handleNoteFocus}
              placeholder="这次我学到了…（可选，1–3 句话）"
              className="min-h-24 resize-none text-base leading-relaxed"
              disabled={submitted}
            />
          </div>
        )}

        {/* 底部 padding */}
        <div className="h-4" />
      </div>

      {/* 底部固定：完成训练按钮（解析完成后显示） */}
      {!isStreaming && (parsedEval || parseError) && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={submitted}
            className="w-full h-14 text-base font-semibold disabled:opacity-50"
          >
            {submitted ? '正在保存…' : '完成训练 ✓'}
          </Button>
        </div>
      )}
    </div>
  )
}
