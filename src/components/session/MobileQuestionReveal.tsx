'use client'

import { useState, useRef } from 'react'
import { Scenario } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

function countChars(text: string): number {
  return text.replace(/\s+/g, '').length
}

interface MobileQuestionRevealProps {
  scenario: Scenario
  answer: string
  onAnswerChange: (a: string) => void
  onSubmit: () => void
}

export function MobileQuestionReveal({
  scenario,
  answer,
  onAnswerChange,
  onSubmit,
}: MobileQuestionRevealProps) {
  const [scenarioExpanded, setScenarioExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charCount = countChars(answer)
  const canSubmit = answer.length >= 30

  // iOS 键盘弹出时将 textarea 滚动到可见区域
  const handleTextareaFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }

  const charCountColor =
    charCount < 30
      ? 'text-gray-400'
      : charCount < 150
      ? 'text-yellow-600'
      : charCount <= 300
      ? 'text-green-600'
      : 'text-orange-500'

  return (
    <div className="flex flex-col h-full">
      {/* 顶部：场景简要（可折叠，默认收起） */}
      <div className="border-b border-gray-100">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          onClick={() => setScenarioExpanded(v => !v)}
          aria-expanded={scenarioExpanded}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              场景回顾
            </span>
            <span className="text-sm font-medium text-gray-700 truncate">{scenario.title}</span>
          </div>
          <span className="text-xs text-gray-400 ml-3 shrink-0">
            {scenarioExpanded ? '收起 ▲' : '展开 ▼'}
          </span>
        </button>

        {scenarioExpanded && (
          <div className="px-4 pb-4 space-y-2 text-sm text-gray-500 leading-relaxed max-h-48 overflow-y-auto">
            {scenario.scenarioText.split('\n').map((p, i) =>
              p.trim() ? <p key={i}>{p}</p> : null
            )}
          </div>
        )}
      </div>

      {/* 中间可滚动区：问题 + textarea */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* 训练问题列表 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">训练问题</h3>
          <ol className="space-y-4 list-none">
            {scenario.questions.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-base leading-relaxed text-gray-900 pt-0.5">{q}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* 作答 textarea */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">你的作答</h3>
          <Textarea
            ref={textareaRef}
            value={answer}
            onChange={e => onAnswerChange(e.target.value)}
            onFocus={handleTextareaFocus}
            placeholder="请在此输入你的分析（建议 150–300 字）…"
            className="min-h-40 resize-none text-base leading-relaxed"
            aria-label="作答输入框"
          />
        </div>

        {/* 底部 padding 避免被固定按钮遮挡 */}
        <div className="h-4" />
      </div>

      {/* 底部固定：字数提示 + 提交按钮 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={cn('tabular-nums', charCountColor)}>
            已写 {charCount} 字
            {charCount > 0 && charCount < 30 && (
              <span className="text-gray-400 ml-1">（至少 30 字才可提交）</span>
            )}
            {charCount >= 150 && charCount <= 300 && (
              <span className="ml-1">✓ 长度合适</span>
            )}
            {charCount > 300 && (
              <span className="text-orange-500 ml-1">（建议不超过 300 字）</span>
            )}
          </span>
        </div>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full h-14 text-base font-semibold disabled:opacity-50"
        >
          提交答案
        </Button>
      </div>
    </div>
  )
}
