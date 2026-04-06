'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const COUNTDOWN_SECONDS = 60

interface ThinkingGateProps {
  onReady: () => void
  totalSessions: number
}

export function ThinkingGate({ onReady, totalSessions }: ThinkingGateProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const [timerDone, setTimerDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Users with ≥30 sessions can skip immediately; others must wait
  const canSkipImmediately = totalSessions >= 30
  const canProceed = timerDone || canSkipImmediately

  useEffect(() => {
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
  }, [])

  // Percentage elapsed for the visual ring
  const progressPct = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progressPct / 100)

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center gap-8 py-12 px-4 text-center">
      {/* 大标题区 */}
      <div className="space-y-3">
        <div className="text-6xl" role="img" aria-label="思考">🧠</div>
        <h2 className="text-2xl font-bold tracking-tight">在问题揭示前，先思考一下…</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          这个环节的目的是让你先形成初步判断，再看问题引导。<br />
          好的思考者总是先有自己的判断，再去对照框架。
        </p>
      </div>

      {/* 倒计时环形视觉 */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 128 128"
          aria-hidden="true"
        >
          {/* 背景轨道 */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/40"
          />
          {/* 进度弧 */}
          <circle
            cx="64"
            cy="64"
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
        <div className="relative z-10 flex flex-col items-center">
          {timerDone ? (
            <span className="text-3xl">✓</span>
          ) : (
            <>
              <span className="text-3xl font-bold tabular-nums leading-none">{secondsLeft}</span>
              <span className="text-xs text-muted-foreground mt-0.5">秒</span>
            </>
          )}
        </div>
      </div>

      {/* 提示文字 / 按钮 */}
      {canProceed ? (
        <Button
          size="lg"
          onClick={onReady}
          className="px-10"
        >
          我已思考好，揭示问题 →
        </Button>
      ) : (
        <div className="space-y-3">
          <Button
            size="lg"
            disabled
            className="px-10 cursor-not-allowed"
          >
            请等待倒计时完成
          </Button>
          <p className="text-xs text-muted-foreground">
            完成 30 次训练后可立即跳过等待（当前：{totalSessions} 次）
          </p>
        </div>
      )}
    </div>
  )
}
