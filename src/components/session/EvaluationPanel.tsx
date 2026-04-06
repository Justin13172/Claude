'use client'

import { useState, useEffect, useRef } from 'react'
import { AIEvaluation } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn, VERDICT_LABELS } from '@/lib/utils'

// Score-to-bar width (out of 5)
function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex gap-1">
        {([1, 2, 3, 4, 5] as const).map(n => (
          <div
            key={n}
            className={cn(
              'w-5 h-2.5 rounded-sm transition-colors',
              n <= score
                ? score >= 4
                  ? 'bg-green-500'
                  : score === 3
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
                : 'bg-muted'
            )}
          />
        ))}
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">{score}/5</span>
    </div>
  )
}

interface EvaluationPanelProps {
  evaluationText: string
  isStreaming: boolean
  onComplete: (evaluation: AIEvaluation, retrospectiveNote: string) => void
}

export function EvaluationPanel({ evaluationText, isStreaming, onComplete }: EvaluationPanelProps) {
  const [parsedEval, setParsedEval] = useState<AIEvaluation | null>(null)
  const [parseError, setParseError] = useState(false)
  const [retrospectiveNote, setRetrospectiveNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const streamEndRef = useRef<HTMLDivElement>(null)

  // Try to parse JSON once streaming stops
  useEffect(() => {
    if (isStreaming) return
    if (!evaluationText.trim()) return

    try {
      // The API may return raw JSON or JSON wrapped in a code block
      const jsonMatch =
        evaluationText.match(/```json\n?([\s\S]*?)\n?```/) ||
        evaluationText.match(/(\{[\s\S]*\})/)

      const rawJson = jsonMatch ? jsonMatch[1] : evaluationText.trim()
      const data = JSON.parse(rawJson) as AIEvaluation

      // Validate minimally
      if (!Array.isArray(data.dimensions) || !data.overallVerdict) {
        throw new Error('格式不完整')
      }

      // Stamp generation time if missing
      if (!data.generatedAt) data.generatedAt = new Date().toISOString()

      setParsedEval(data)
    } catch {
      setParseError(true)
    }
  }, [isStreaming, evaluationText])

  // Auto-scroll to bottom while streaming
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

  const verdictMeta = parsedEval
    ? VERDICT_LABELS[parsedEval.overallVerdict] ?? VERDICT_LABELS['developing']
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── 标题区 ── */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">🤖 AI 深度评估</h2>
        {isStreaming && (
          <p className="text-sm text-muted-foreground animate-pulse">
            正在生成评估报告，请稍候…
          </p>
        )}
      </div>

      {/* ── 流式原始文本（评估中显示） ── */}
      {(isStreaming || (!parsedEval && !parseError)) && evaluationText && (
        <Card>
          <CardContent className="pt-4">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground overflow-x-auto">
              {evaluationText}
            </pre>
            <div ref={streamEndRef} />
          </CardContent>
        </Card>
      )}

      {/* ── 解析失败回退 ── */}
      {!isStreaming && parseError && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base text-destructive">评估报告（原始格式）</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-3">
              JSON 解析遇到问题，以下为原始评估文本：
            </p>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono bg-muted/50 rounded-lg p-4 overflow-x-auto">
              {evaluationText}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* ── 结构化评估结果 ── */}
      {!isStreaming && parsedEval && (
        <>
          {/* 整体评级 */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">整体评级：</span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold',
                      verdictMeta?.color
                    )}
                  >
                    {verdictMeta?.label}
                  </span>
                </div>
                <p className="text-[14px] leading-relaxed text-foreground flex-1">
                  {parsedEval.overallSummary}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 维度评分 */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base font-semibold">各维度评分</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y">
                {parsedEval.dimensions.map((dim, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-medium text-[14px]">{dim.name}</span>
                      <ScoreBar score={dim.score} />
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-snug">{dim.rationale}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── 训练反思（流式结束后显示，无论解析成功与否） ── */}
      {!isStreaming && evaluationText && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">训练反思</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              这次训练我学到了…（可选，1–3 句话）
            </p>
            <Textarea
              value={retrospectiveNote}
              onChange={e => setRetrospectiveNote(e.target.value)}
              placeholder="例：我意识到在分析需求时，我习惯直接跳到解决方案，而没有先澄清用户真正的目标……"
              className="min-h-[100px] resize-none text-[14px]"
              disabled={submitted}
            />
          </CardContent>
        </Card>
      )}

      {/* ── 完成按钮 ── */}
      {!isStreaming && (parsedEval || parseError) && (
        <div className="flex justify-center pb-6">
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={submitted}
            className="px-12"
          >
            {submitted ? '正在保存…' : '完成训练 ✓'}
          </Button>
        </div>
      )}
    </div>
  )
}
