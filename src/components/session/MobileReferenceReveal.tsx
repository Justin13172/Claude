'use client'

import { useState } from 'react'
import { Scenario } from '@/types'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SELF_RATING_LABELS: Record<number, string> = {
  1: '差距较大',
  2: '有所欠缺',
  3: '基本到位',
  4: '较为出色',
  5: '完全准确',
}

const SELF_RATING_COLORS: Record<number, string> = {
  1: 'border-red-300 bg-red-50 text-red-700',
  2: 'border-orange-300 bg-orange-50 text-orange-700',
  3: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  4: 'border-blue-300 bg-blue-50 text-blue-700',
  5: 'border-green-300 bg-green-50 text-green-700',
}

const SELF_RATING_SELECTED_COLORS: Record<number, string> = {
  1: 'border-red-500 bg-red-500 text-white shadow-md scale-105',
  2: 'border-orange-500 bg-orange-500 text-white shadow-md scale-105',
  3: 'border-yellow-500 bg-yellow-500 text-white shadow-md scale-105',
  4: 'border-blue-500 bg-blue-500 text-white shadow-md scale-105',
  5: 'border-green-500 bg-green-500 text-white shadow-md scale-105',
}

// 答案折行数限制相关
const MAX_COLLAPSED_LINES = 6

interface MobileReferenceRevealProps {
  scenario: Scenario
  userAnswer: string
  selfRating: number | null
  onSelfRatingChange: (r: number) => void
  onEvaluate: () => void
  onSkipEvaluate: () => void
}

export function MobileReferenceReveal({
  scenario,
  userAnswer,
  selfRating,
  onSelfRatingChange,
  onEvaluate,
  onSkipEvaluate,
}: MobileReferenceRevealProps) {
  const [answerExpanded, setAnswerExpanded] = useState(false)
  const ref = scenario.referenceAnswer
  const hasRating = selfRating !== null

  // 估算是否需要"展开全部"按钮（简单以换行数+字符长度估算）
  const answerLines = userAnswer.split('\n').length
  const answerChars = userAnswer.length
  const answerIsLong = answerLines > MAX_COLLAPSED_LINES || answerChars > 300

  return (
    <div className="flex flex-col h-full">
      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* 你的作答（灰底卡片） */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">你的作答</h3>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div
              className={cn(
                'text-base leading-relaxed whitespace-pre-wrap text-gray-800 overflow-hidden',
                !answerExpanded && answerIsLong && 'line-clamp-6'
              )}
            >
              {userAnswer}
            </div>
            {answerIsLong && (
              <button
                className="mt-2 text-sm text-blue-600 font-medium"
                onClick={() => setAnswerExpanded(v => !v)}
              >
                {answerExpanded ? '收起 ▲' : '展开全部 ▼'}
              </button>
            )}
          </div>
        </div>

        {/* 参考答案（Accordion，默认收起） */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">参考答案</h3>
          <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            <Accordion multiple={false}>
              <AccordionItem value="reference">
                <AccordionTrigger className="px-4 text-base font-medium text-gray-800 py-4">
                  点击展开参考答案 — 建议先自评再查看
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-5 space-y-5">
                    {/* 框架标签 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">所用框架：</span>
                      <Badge variant="secondary" className="text-xs h-auto px-2 py-0.5">
                        {ref.frameworkUsed}
                      </Badge>
                    </div>

                    {/* 各章节 */}
                    {ref.sections.map((section, i) => (
                      <div key={i} className="space-y-1.5">
                        <h4 className="font-semibold text-base text-gray-900">{section.title}</h4>
                        <p className="text-base leading-relaxed text-gray-700">{section.content}</p>
                        <p className="text-sm text-gray-400 italic border-l-2 border-blue-200 pl-3">
                          💡 为什么重要：{section.whyThisMatters}
                        </p>
                      </div>
                    ))}

                    {/* 常见错误 */}
                    {ref.commonMistakes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-base text-red-600">常见错误</h4>
                        <ul className="space-y-2">
                          {ref.commonMistakes.map((mistake, i) => (
                            <li key={i} className="flex items-start gap-2 text-base">
                              <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                              <span className="text-gray-700">{mistake}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 延伸阅读 */}
                    {ref.furtherReading.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-base text-gray-900">延伸阅读</h4>
                        <ul className="space-y-2">
                          {ref.furtherReading.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-gray-400 mt-0.5 shrink-0">📖</span>
                              <span>
                                {item.url ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 text-blue-600"
                                  >
                                    {item.title}
                                  </a>
                                ) : (
                                  <span className="font-medium text-gray-800">{item.title}</span>
                                )}
                                {item.author && (
                                  <span className="text-gray-400 ml-1">— {item.author}</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* 自我评分（5 个大按钮，2+3 排列） */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            自我评分 <span className="text-red-400 normal-case font-normal">（必填）</span>
          </h3>
          {/* 第一行：1 和 2 */}
          <div className="flex gap-3">
            {([1, 2] as const).map(rating => (
              <button
                key={rating}
                onClick={() => onSelfRatingChange(rating)}
                aria-pressed={selfRating === rating}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all',
                  'min-h-[72px]',
                  selfRating === rating
                    ? SELF_RATING_SELECTED_COLORS[rating]
                    : cn('bg-white', SELF_RATING_COLORS[rating])
                )}
              >
                <span className="text-2xl font-bold leading-none">{rating}</span>
                <span className="text-xs leading-tight text-center font-medium">
                  {SELF_RATING_LABELS[rating]}
                </span>
              </button>
            ))}
          </div>
          {/* 第二行：3、4 和 5 */}
          <div className="flex gap-3">
            {([3, 4, 5] as const).map(rating => (
              <button
                key={rating}
                onClick={() => onSelfRatingChange(rating)}
                aria-pressed={selfRating === rating}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all',
                  'min-h-[72px]',
                  selfRating === rating
                    ? SELF_RATING_SELECTED_COLORS[rating]
                    : cn('bg-white', SELF_RATING_COLORS[rating])
                )}
              >
                <span className="text-2xl font-bold leading-none">{rating}</span>
                <span className="text-xs leading-tight text-center font-medium">
                  {SELF_RATING_LABELS[rating]}
                </span>
              </button>
            ))}
          </div>

          {selfRating && (
            <p className="text-center text-sm text-gray-500">
              你选择了：
              <span className="font-semibold text-gray-800">
                {selfRating} 分 — {SELF_RATING_LABELS[selfRating]}
              </span>
            </p>
          )}
        </div>

        {/* 底部 padding */}
        <div className="h-4" />
      </div>

      {/* 底部固定：评分选择后显示两个按钮 */}
      {hasRating && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-3">
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={onEvaluate}
              className="flex-1 h-14 text-base font-semibold"
            >
              🤖 AI 评估
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onSkipEvaluate}
              className="flex-1 h-14 text-base font-semibold"
            >
              跳过完成
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
