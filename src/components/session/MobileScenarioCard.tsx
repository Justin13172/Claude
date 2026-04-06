'use client'

import { Scenario } from '@/types'
import { METHOD_META, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const DIFFICULTY_LABELS: Record<string, string> = {
  foundation: '入门',
  advanced: '进阶',
  expert: '专家',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  foundation: 'bg-blue-100 text-blue-700',
  advanced: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
}

interface MobileScenarioCardProps {
  scenario: Scenario
  onReady: () => void
}

export function MobileScenarioCard({ scenario, onReady }: MobileScenarioCardProps) {
  const meta = METHOD_META[scenario.method]

  return (
    <div className="flex flex-col h-full">
      {/* 顶部：方法 badge + 难度 badge + 来源 */}
      <div className="px-4 pt-4 pb-3 space-y-2 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl" aria-hidden="true">{meta.icon}</span>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700">
            {meta.label}
          </span>
          <span className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
            DIFFICULTY_COLORS[scenario.difficulty] ?? 'bg-gray-100 text-gray-700'
          )}>
            {DIFFICULTY_LABELS[scenario.difficulty] ?? scenario.difficulty}
          </span>
          {scenario.tier === 'ai-generated' && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-gray-50 text-gray-500 border border-gray-200">
              AI 生成
            </span>
          )}
        </div>

        <h2 className="text-base font-semibold text-gray-900 leading-snug">{scenario.title}</h2>

        {scenario.source && (
          <p className="text-xs text-gray-400">来源：{scenario.source}</p>
        )}
      </div>

      {/* 中间：场景正文（可滚动） */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-4 text-base leading-relaxed text-gray-800">
          {scenario.scenarioText.split('\n').map((paragraph, i) =>
            paragraph.trim() ? (
              <p key={i}>{paragraph}</p>
            ) : null
          )}
        </div>

        {/* 底部阅读提示（滚动区内） */}
        <p className="mt-8 text-sm text-gray-400 text-center italic">
          请仔细阅读以上场景，思考你的初步判断后再继续。
        </p>
      </div>

      {/* 底部固定：进入下一步按钮 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
        <Button
          size="lg"
          onClick={onReady}
          className="w-full h-14 text-base font-semibold"
        >
          我已读完，进入思考 →
        </Button>
      </div>
    </div>
  )
}
