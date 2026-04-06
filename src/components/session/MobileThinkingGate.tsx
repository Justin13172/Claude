'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const COUNTDOWN_SECONDS = 60

interface MobileThinkingGateProps {
  onReady: () => void
  totalSessions: number
}

export function MobileThinkingGate({ onReady, totalSessions }: MobileThinkingGateProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const [timerDone, setTimerDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const canSkipImmediately = totalSessions >= 30
  const canProceed = timerDone || canSkipImmediately

  useEffect(() => {
    if (canSkipImmediately) return

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setTimerDone(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // SVG 倒计时圆圈参数（直径 160px → r=64，viewBox=160×160）
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const progressPct = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100
  const strokeDashoffset = circumference * (1 - progressPct / 100)

  return (
    <div className="flex flex-col h-full">
      {/* 全屏居中内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
        {/* 大脑 emoji */}
        <div className="text-7xl" role="img" aria-label="思考">🧠</div>

        {/* 标题 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">思考时间</h2>
          <p className="text-base text-gray-500 leading-relaxed max-w-xs mx-auto">
            在问题揭示之前，先形成你自己的初步判断。<br />
            好的思考者总是先有自己的想法。
          </p>
        </div>

        {/* 倒计时圆圈（直径 160px） */}
        {!canSkipImmediately && (
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 160 160"
              aria-hidden="true"
            >
              {/* 背景轨道 */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200"
              />
              {/* 进度弧 */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={cn(
                  'transition-[stroke-dashoffset] duration-1000 ease-linear',
                  timerDone ? 'text-green-500' : 'text-primary'
                )}
              />
            </svg>

            {/* 中间数字 */}
            <div className="relative z-10 flex flex-col items-center">
              {timerDone ? (
                <span className="text-4xl text-green-500">✓</span>
              ) : (
                <>
                  <span className="text-4xl font-bold tabular-nums leading-none text-gray-900">
                    {secondsLeft}
                  </span>
                  <span className="text-sm text-gray-400 mt-1">秒</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* 提示文字 */}
        {canSkipImmediately && (
          <p className="text-sm text-gray-400">
            训练次数已达 30 次，可直接跳过等待
          </p>
        )}

        {!canProceed && (
          <p className="text-xs text-gray-400 -mt-4">
            完成 30 次训练后可立即跳过（当前：{totalSessions} 次）
          </p>
        )}
      </div>

      {/* 底部固定按钮 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
        <Button
          size="lg"
          onClick={onReady}
          disabled={!canProceed}
          className="w-full h-14 text-base font-semibold disabled:opacity-50"
        >
          {canProceed ? '我已思考好，揭示问题 →' : `请等待倒计时完成（${secondsLeft}s）`}
        </Button>
      </div>
    </div>
  )
}
