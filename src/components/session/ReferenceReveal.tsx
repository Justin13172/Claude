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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const SELF_RATING_LABELS: Record<number, string> = {
  1: '差距较大',
  2: '有所欠缺',
  3: '基本到位',
  4: '较为出色',
  5: '完全准确',
}

interface ReferenceRevealProps {
  scenario: Scenario
  userAnswer: string
  selfRating: number | null
  onSelfRatingChange: (r: number) => void
  onEvaluate: () => void
  onSkipEvaluate: () => void
}

export function ReferenceReveal({
  scenario,
  userAnswer,
  selfRating,
  onSelfRatingChange,
  onEvaluate,
  onSkipEvaluate,
}: ReferenceRevealProps) {
  const [referenceOpened, setReferenceOpened] = useState(false)
  const ref = scenario.referenceAnswer
  const hasRating = selfRating !== null

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── 你的作答（只读） ── */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">你的作答</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="bg-muted/50 rounded-lg p-4 text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">
            {userAnswer}
          </div>
        </CardContent>
      </Card>

      {/* ── 参考答案（折叠，默认收起） ── */}
      <Card>
        <CardContent className="pt-4">
          <Accordion
            multiple={false}
            onValueChange={(values: string[]) => {
              setReferenceOpened(values.length > 0)
            }}
          >
            <AccordionItem value="reference">
              <AccordionTrigger className="text-[15px] font-semibold py-3">
                参考答案（点击展开）—— 请先回顾自己的作答再查看
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-5 pt-2">
                  {/* 框架标签 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      所用框架：
                    </span>
                    <Badge variant="secondary" className="text-xs h-auto px-2 py-0.5">
                      {ref.frameworkUsed}
                    </Badge>
                  </div>

                  {/* 各章节 */}
                  {ref.sections.map((section, i) => (
                    <div key={i} className="space-y-1.5">
                      <h4 className="font-semibold text-[14px]">{section.title}</h4>
                      <p className="text-[14px] leading-relaxed text-foreground">{section.content}</p>
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                        💡 为什么重要：{section.whyThisMatters}
                      </p>
                    </div>
                  ))}

                  {/* 常见错误 */}
                  {ref.commonMistakes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-[14px] text-destructive/80">常见错误</h4>
                      <ul className="space-y-1">
                        {ref.commonMistakes.map((mistake, i) => (
                          <li key={i} className="flex items-start gap-2 text-[14px]">
                            <span className="text-destructive/70 mt-0.5 shrink-0">✗</span>
                            <span className="text-foreground">{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 延伸阅读 */}
                  {ref.furtherReading.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-[14px]">延伸阅读</h4>
                      <ul className="space-y-1.5">
                        {ref.furtherReading.map((item, i) => (
                          <li key={i} className="text-[13px] flex items-start gap-2">
                            <span className="text-muted-foreground mt-0.5 shrink-0">📖</span>
                            <span>
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2 hover:text-primary"
                                >
                                  {item.title}
                                </a>
                              ) : (
                                <span className="font-medium">{item.title}</span>
                              )}
                              {item.author && (
                                <span className="text-muted-foreground ml-1">— {item.author}</span>
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

          {/* 展开提示（展开前显示）*/}
          {!referenceOpened && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              建议先完成自我评分，再展开查看参考答案
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── 自我评分（必填） ── */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">
            自我评分
            <span className="text-destructive ml-1 text-sm font-normal">（必填）</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3 justify-center">
            {([1, 2, 3, 4, 5] as const).map(rating => (
              <button
                key={rating}
                onClick={() => onSelfRatingChange(rating)}
                aria-pressed={selfRating === rating}
                className={cn(
                  'flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium min-w-[88px]',
                  selfRating === rating
                    ? 'border-primary bg-primary text-primary-foreground shadow-md scale-105'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted/40 text-foreground'
                )}
              >
                <span className="text-xl font-bold">{rating}</span>
                <span className="text-xs leading-tight text-center">
                  {SELF_RATING_LABELS[rating]}
                </span>
              </button>
            ))}
          </div>

          {selfRating && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              你选择了：<span className="font-semibold text-foreground">{selfRating} 分 — {SELF_RATING_LABELS[selfRating]}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── 操作按钮（评分后显示） ── */}
      {hasRating && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={onEvaluate}
            className="px-8 sm:flex-1"
          >
            🤖 AI 深度评估
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSkipEvaluate}
            className="px-8 sm:flex-1"
          >
            跳过，完成训练
          </Button>
        </div>
      )}
    </div>
  )
}
