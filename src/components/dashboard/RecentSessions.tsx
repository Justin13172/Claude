'use client'

import Link from 'next/link'
import { CompletedSession } from '@/types'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateCN } from '@/lib/utils'
import { cn } from '@/lib/utils'

const VERDICT_STYLE: Record<string, string> = {
  strength:   'border-green-200  bg-green-50  text-green-700',
  developing: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  gap:        'border-red-200    bg-red-50    text-red-700',
}
const VERDICT_LABEL: Record<string, string> = {
  strength:   '优势项',
  developing: '发展中',
  gap:        '待提升',
}

function StarRating({ rating }: { rating: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="text-sm" aria-label={`自评${rating}星`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-200'}>
          ★
        </span>
      ))}
    </span>
  )
}

interface RecentSessionsProps {
  sessions: CompletedSession[]
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  const recent = [...sessions]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 5)

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700">
          最近训练记录
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2 pb-0">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-gray-400">
            <span className="text-4xl">📭</span>
            <p className="text-sm">还没有训练记录，开始第一次训练吧！</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((session) => {
              const verdict = session.aiEvaluation?.overallVerdict
              return (
                <li
                  key={session.id}
                  className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left: icon + meta */}
                  <div className="flex min-w-0 items-start gap-3 sm:items-center">
                    <span
                      className="mt-0.5 flex-shrink-0 text-xl leading-none sm:mt-0"
                      aria-hidden
                    >
                      {/* icon is stored in methodLabel but we can derive it from method */}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {/* Date */}
                      <span className="text-[11px] text-gray-400">
                        {formatDateCN(session.completedAt)}
                      </span>
                      {/* Method + title */}
                      <span className="truncate text-sm font-medium text-gray-800">
                        {session.methodLabel} · {session.scenarioTitle}
                      </span>
                    </div>
                  </div>

                  {/* Right: rating + verdict */}
                  <div className="flex flex-shrink-0 items-center gap-2 pl-0 sm:pl-4">
                    <StarRating rating={session.selfRating} />
                    {verdict && (
                      <Badge
                        variant="outline"
                        className={cn('text-[10px]', VERDICT_STYLE[verdict])}
                      >
                        {VERDICT_LABEL[verdict]}
                      </Badge>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      {recent.length > 0 && (
        <CardFooter className="justify-center">
          <Link
            href="/history"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            查看全部记录 →
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}
