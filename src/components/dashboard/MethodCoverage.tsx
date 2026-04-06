'use client'

import { CompletedSession, MethodId } from '@/types'
import { METHOD_META } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const METHOD_IDS: MethodId[] = [
  'requirement-translation',
  'product-teardown',
  'roadmap-decisions',
  'judgment-review',
  'raw-user-data',
  'learning-process',
]

const METHOD_BAR_COLOR: Record<MethodId, string> = {
  'requirement-translation': 'bg-blue-500',
  'product-teardown':        'bg-purple-500',
  'roadmap-decisions':       'bg-orange-500',
  'judgment-review':         'bg-green-500',
  'raw-user-data':           'bg-red-500',
  'learning-process':        'bg-yellow-500',
}

interface MethodCoverageProps {
  sessions: CompletedSession[]
}

export function MethodCoverage({ sessions }: MethodCoverageProps) {
  // Only count sessions from the last 30 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString()

  const recent = sessions.filter((s) => s.completedAt >= cutoffStr)

  // Count per method
  const counts: Record<MethodId, number> = {
    'requirement-translation': 0,
    'product-teardown':        0,
    'roadmap-decisions':       0,
    'judgment-review':         0,
    'raw-user-data':           0,
    'learning-process':        0,
  }
  for (const s of recent) {
    counts[s.method] = (counts[s.method] ?? 0) + 1
  }

  const maxCount = Math.max(1, ...Object.values(counts))

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700">
          方法覆盖分析（最近30天）
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col gap-3">
          {METHOD_IDS.map((id) => {
            const meta  = METHOD_META[id]
            const count = counts[id]
            const pct   = Math.round((count / maxCount) * 100)
            const barColor = METHOD_BAR_COLOR[id]

            return (
              <div key={id} className="flex flex-col gap-1">
                {/* Top row: icon + name + count / badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-base leading-none">{meta.icon}</span>
                    <span className="truncate text-xs font-medium text-gray-700">
                      {meta.shortLabel}
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    {count === 0 ? (
                      <Badge
                        variant="outline"
                        className="border-orange-200 bg-orange-50 text-orange-600 text-[10px]"
                      >
                        ⚠️ 待练习
                      </Badge>
                    ) : (
                      <span className="text-xs font-semibold text-gray-500">
                        {count} 次
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar (raw primitives to control color) */}
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
