'use client'

import Link from 'next/link'
import { TodaySchedule } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Maps method IDs to a left-border accent color
const METHOD_BORDER_COLOR: Record<string, string> = {
  'requirement-translation': 'border-l-blue-500',
  'product-teardown':        'border-l-purple-500',
  'roadmap-decisions':       'border-l-orange-500',
  'judgment-review':         'border-l-green-500',
  'raw-user-data':           'border-l-red-500',
  'learning-process':        'border-l-yellow-500',
}

const METHOD_BG_COLOR: Record<string, string> = {
  'requirement-translation': 'bg-blue-50',
  'product-teardown':        'bg-purple-50',
  'roadmap-decisions':       'bg-orange-50',
  'judgment-review':         'bg-green-50',
  'raw-user-data':           'bg-red-50',
  'learning-process':        'bg-yellow-50',
}

interface TodayCardProps {
  schedule: TodaySchedule
}

export function TodayCard({ schedule }: TodayCardProps) {
  const borderColor = METHOD_BORDER_COLOR[schedule.method] ?? 'border-l-gray-400'
  const bgColor     = METHOD_BG_COLOR[schedule.method]    ?? 'bg-gray-50'

  return (
    <Card
      className={cn(
        'border-l-4 shadow-sm',
        borderColor,
      )}
    >
      <CardContent className="pt-2 pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: icon + labels */}
          <div className="flex items-start gap-4">
            {/* Large icon */}
            <div
              className={cn(
                'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-4xl',
                bgColor,
              )}
            >
              {schedule.icon}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1.5">
              {/* Top badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="text-xs">今日训练</Badge>
                <Badge variant="outline" className="text-xs">
                  ⏱ 约{schedule.estimatedMinutes}分钟
                </Badge>
              </div>

              {/* Method name */}
              <h2 className="text-lg font-semibold leading-snug text-gray-900">
                {schedule.methodLabel}
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-500">{schedule.methodDescription}</p>

              {/* Session context */}
              <p className="text-xs font-medium text-gray-400">{schedule.sessionContext}</p>
            </div>
          </div>

          {/* Right: action area */}
          <div className="flex flex-shrink-0 items-center gap-3 sm:justify-end">
            {schedule.isCompleted ? (
              <>
                <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5">
                  <span className="text-lg">✅</span>
                  <span className="text-sm font-semibold text-green-700">今日已完成</span>
                </div>
                <Link href={`/session/${schedule.method}`}>
                  <Button variant="outline" size="sm" className="h-9 px-4 text-sm">
                    再练一次 →
                  </Button>
                </Link>
              </>
            ) : (
              <Link href={`/session/${schedule.method}`}>
                <Button size="lg" className="h-10 px-6 text-sm font-semibold">
                  开始今日训练 →
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
