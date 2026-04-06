'use client'

import { Scenario } from '@/types'
import { METHOD_META } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const DIFFICULTY_LABELS: Record<string, string> = {
  foundation: '入门',
  advanced: '进阶',
  expert: '专家',
}

const DIFFICULTY_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  foundation: 'secondary',
  advanced: 'default',
  expert: 'destructive',
}

interface ScenarioCardProps {
  scenario: Scenario
  onReady: () => void
}

export function ScenarioCard({ scenario, onReady }: ScenarioCardProps) {
  const meta = METHOD_META[scenario.method]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 方法与难度标签行 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-2xl" aria-hidden="true">{meta.icon}</span>
        <Badge variant="outline" className="text-sm font-medium px-3 py-1 h-auto">
          {meta.label}
        </Badge>
        <Badge
          variant={DIFFICULTY_BADGE_VARIANT[scenario.difficulty] ?? 'secondary'}
          className="text-sm px-3 py-1 h-auto"
        >
          {DIFFICULTY_LABELS[scenario.difficulty] ?? scenario.difficulty}
        </Badge>
        {scenario.tier === 'ai-generated' && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            AI 生成
          </Badge>
        )}
      </div>

      {/* 场景主卡片 */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl leading-snug">{scenario.title}</CardTitle>
          {scenario.source && (
            <p className="text-xs text-muted-foreground mt-1">来源：{scenario.source}</p>
          )}
        </CardHeader>

        <CardContent className="pt-5">
          {/* 场景正文 */}
          <div className="prose prose-sm max-w-none text-foreground">
            {scenario.scenarioText.split('\n').map((paragraph, i) =>
              paragraph.trim() ? (
                <p key={i} className="mb-4 leading-relaxed text-[15px]">
                  {paragraph}
                </p>
              ) : null
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col items-start gap-4">
          {/* 阅读提示 */}
          <p className="text-sm text-muted-foreground italic w-full text-center">
            请仔细阅读以上场景，思考你的初步判断后再继续。
          </p>
          <div className="w-full flex justify-center">
            <Button
              size="lg"
              onClick={onReady}
              className="px-8"
            >
              我已读完，进入思考 →
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
