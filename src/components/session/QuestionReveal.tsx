'use client'

import { useState } from 'react'
import { Scenario } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// Count characters (Chinese chars count as 1 each, space-separated words also 1 each)
function countChars(text: string): number {
  // Trim and count all non-whitespace characters; for CJK each char is one unit
  return text.replace(/\s+/g, '').length
}

interface QuestionRevealProps {
  scenario: Scenario
  answer: string
  onAnswerChange: (a: string) => void
  onSubmit: () => void
}

export function QuestionReveal({ scenario, answer, onAnswerChange, onSubmit }: QuestionRevealProps) {
  const [scenarioExpanded, setScenarioExpanded] = useState(false)
  const charCount = countChars(answer)
  const canSubmit = answer.length >= 30

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── 场景回顾（折叠） ── */}
      <Card>
        <CardHeader
          className={cn(
            'cursor-pointer select-none border-b transition-colors hover:bg-muted/40',
            scenarioExpanded && 'bg-muted/20'
          )}
          onClick={() => setScenarioExpanded(v => !v)}
          role="button"
          aria-expanded={scenarioExpanded}
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setScenarioExpanded(v => !v)
            }
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                场景回顾
              </span>
              <span className="text-sm font-medium text-foreground">{scenario.title}</span>
            </div>
            <span className="text-xs text-muted-foreground ml-4 shrink-0">
              {scenarioExpanded ? '收起 ▲' : '展开 ▼'}
            </span>
          </div>
        </CardHeader>

        {scenarioExpanded && (
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              {scenario.scenarioText.split('\n').map((p, i) =>
                p.trim() ? <p key={i}>{p}</p> : null
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── 训练问题 ── */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">训练问题</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ol className="space-y-3 list-none">
            {scenario.questions.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[15px] leading-relaxed">{q}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* ── 作答区 ── */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">你的作答</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            value={answer}
            onChange={e => onAnswerChange(e.target.value)}
            placeholder="请在此输入你的分析（建议150-300字）..."
            className="min-h-[200px] resize-none text-[15px] leading-relaxed"
            aria-label="作答输入框"
          />

          <div className="flex items-center justify-between">
            {/* 字数统计 */}
            <span
              className={cn(
                'text-sm tabular-nums',
                charCount < 30
                  ? 'text-muted-foreground'
                  : charCount < 150
                  ? 'text-yellow-600'
                  : charCount <= 300
                  ? 'text-green-600'
                  : 'text-orange-500'
              )}
            >
              已写 {charCount} 字
              {charCount > 0 && charCount < 30 && (
                <span className="text-muted-foreground ml-1">（至少 30 字才可提交）</span>
              )}
              {charCount >= 150 && charCount <= 300 && (
                <span className="ml-1">✓ 长度合适</span>
              )}
              {charCount > 300 && (
                <span className="text-orange-500 ml-1">（建议不超过 300 字）</span>
              )}
            </span>

            {/* 提交按钮 */}
            <Button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="px-8"
            >
              提交答案
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
