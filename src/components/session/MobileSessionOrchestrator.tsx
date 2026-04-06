'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Scenario, CompletedSession, MethodId, AIEvaluation } from '@/types'
import { saveSession, getSessions } from '@/lib/storage'
import { generateId, getISOWeekNumber, METHOD_META, VERDICT_LABELS } from '@/lib/utils'
import { MobileScenarioCard } from './MobileScenarioCard'
import { MobileThinkingGate } from './MobileThinkingGate'
import { MobileQuestionReveal } from './MobileQuestionReveal'
import { MobileReferenceReveal } from './MobileReferenceReveal'
import { MobileEvaluationPanel } from './MobileEvaluationPanel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ── 状态机类型 ─────────────────────────────────────────────────────────────────

type SessionState =
  | { phase: 'loading' }
  | { phase: 'scenario_displayed'; scenario: Scenario }
  | { phase: 'thinking_gate'; scenario: Scenario }
  | { phase: 'question_revealed'; scenario: Scenario; answer: string }
  | { phase: 'answer_submitted'; scenario: Scenario; answer: string }
  | { phase: 'reference_revealed'; scenario: Scenario; answer: string; selfRating: number | null }
  | { phase: 'evaluating'; scenario: Scenario; answer: string; selfRating: number; evaluationText: string }
  | { phase: 'complete'; session: CompletedSession }

// ── 步骤映射（用于顶部进度显示） ──────────────────────────────────────────────

const STEPS = [
  { id: 'scenario_displayed', label: '阅读场景' },
  { id: 'thinking_gate',      label: '初步思考' },
  { id: 'question_revealed',  label: '作答' },
  { id: 'reference_revealed', label: '对照参考' },
  { id: 'evaluating',         label: 'AI 评估' },
  { id: 'complete',           label: '完成' },
] as const

function currentStepIndex(phase: SessionState['phase']): number {
  const map: Record<SessionState['phase'], number> = {
    loading:            -1,
    scenario_displayed:  0,
    thinking_gate:       1,
    question_revealed:   2,
    answer_submitted:    2,
    reference_revealed:  3,
    evaluating:          4,
    complete:            5,
  }
  return map[phase] ?? 0
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface MobileSessionOrchestratorProps {
  method: MethodId
}

// ── 完成界面 ──────────────────────────────────────────────────────────────────

const SELF_RATING_LABELS: Record<number, string> = {
  1: '差距较大',
  2: '有所欠缺',
  3: '基本到位',
  4: '较为出色',
  5: '完全准确',
}

function MobileCompletionScreen({
  session,
  method,
}: {
  session: CompletedSession
  method: MethodId
}) {
  const verdictMeta = session.aiEvaluation
    ? VERDICT_LABELS[session.aiEvaluation.overallVerdict]
    : null

  return (
    <div className="flex flex-col h-full">
      {/* 全屏居中内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6 py-12">
        {/* 大 emoji */}
        <div className="text-7xl" role="img" aria-label="完成">🎉</div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">训练完成！</h1>
          <p className="text-sm text-gray-400">
            {session.scenarioTitle} — {session.methodLabel}
          </p>
        </div>

        {/* 成绩摘要卡 */}
        <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 space-y-4 text-left shadow-sm">
          {/* 自我评分 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">自我评分</span>
            <span className="font-semibold text-gray-900">
              {session.selfRating} 分 — {SELF_RATING_LABELS[session.selfRating]}
            </span>
          </div>

          {/* AI 评级 */}
          {verdictMeta && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">AI 评级</span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-sm font-bold',
                  verdictMeta.color
                )}
              >
                {verdictMeta.label}
              </span>
            </div>
          )}

          {/* AI 总评 */}
          {session.aiEvaluation?.overallSummary && (
            <p className="text-sm leading-relaxed text-gray-700 border-t border-gray-100 pt-3">
              {session.aiEvaluation.overallSummary}
            </p>
          )}
        </div>
      </div>

      {/* 底部固定：两个大按钮 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-3">
        <Button
          size="lg"
          className="w-full h-14 text-base font-semibold"
          onClick={() => window.location.reload()}
        >
          再练一次
        </Button>
        <Link href="/" className="block">
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 text-base font-semibold"
          >
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export function MobileSessionOrchestrator({ method }: MobileSessionOrchestratorProps) {
  const [state, setState] = useState<SessionState>({ phase: 'loading' })
  const [fetchError, setFetchError] = useState<string | null>(null)
  const startTimeRef = useRef<Date>(new Date())
  const totalSessions = getSessions().length

  // ── 加载场景 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchScenario() {
      setFetchError(null)
      startTimeRef.current = new Date()

      try {
        const sessions = getSessions()
        const completedScenarioIds = sessions.map(s => s.scenarioId)

        const res = await fetch('/api/generate-scenario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method, completedScenarioIds }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
        }

        const { scenario } = (await res.json()) as { scenario: Scenario }
        setState({ phase: 'scenario_displayed', scenario })
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : '加载场景失败，请刷新重试')
      }
    }

    fetchScenario()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method])

  // ── 状态转换 ──────────────────────────────────────────────────────────────

  const handleScenarioReady = useCallback(() => {
    setState(prev =>
      prev.phase === 'scenario_displayed'
        ? { phase: 'thinking_gate', scenario: prev.scenario }
        : prev
    )
  }, [])

  const handleThinkingDone = useCallback(() => {
    setState(prev =>
      prev.phase === 'thinking_gate'
        ? { phase: 'question_revealed', scenario: prev.scenario, answer: '' }
        : prev
    )
  }, [])

  const handleAnswerChange = useCallback((answer: string) => {
    setState(prev =>
      prev.phase === 'question_revealed' ? { ...prev, answer } : prev
    )
  }, [])

  const handleAnswerSubmit = useCallback(() => {
    setState(prev =>
      prev.phase === 'question_revealed'
        ? { phase: 'answer_submitted', scenario: prev.scenario, answer: prev.answer }
        : prev
    )
    setState(prev =>
      prev.phase === 'answer_submitted'
        ? { phase: 'reference_revealed', scenario: prev.scenario, answer: prev.answer, selfRating: null }
        : prev
    )
  }, [])

  const handleSelfRatingChange = useCallback((rating: number) => {
    setState(prev =>
      prev.phase === 'reference_revealed' ? { ...prev, selfRating: rating } : prev
    )
  }, [])

  const handleEvaluationComplete = useCallback(
    (evaluation: AIEvaluation, retrospectiveNote: string) => {
      setState(prev => {
        if (prev.phase !== 'evaluating') return prev

        const durationSeconds = Math.round(
          (Date.now() - startTimeRef.current.getTime()) / 1000
        )
        const meta = METHOD_META[prev.scenario.method]
        const now = new Date().toISOString()

        const session: CompletedSession = {
          id: generateId(),
          scenarioId: prev.scenario.id,
          method: prev.scenario.method,
          methodLabel: meta.label,
          scenarioTitle: prev.scenario.title,
          scenarioText: prev.scenario.scenarioText,
          questions: prev.scenario.questions,
          userAnswer: prev.answer,
          referenceAnswer: prev.scenario.referenceAnswer,
          selfRating: prev.selfRating as 1 | 2 | 3 | 4 | 5,
          aiEvaluation: evaluation,
          retrospectiveNote,
          durationSeconds,
          completedAt: now,
          weekNumber: getISOWeekNumber(new Date()),
        }

        saveSession(session)
        return { phase: 'complete', session }
      })
    },
    []
  )

  const handleSkipEvaluate = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'reference_revealed' || prev.selfRating === null) return prev

      const durationSeconds = Math.round(
        (Date.now() - startTimeRef.current.getTime()) / 1000
      )
      const meta = METHOD_META[prev.scenario.method]

      const session: CompletedSession = {
        id: generateId(),
        scenarioId: prev.scenario.id,
        method: prev.scenario.method,
        methodLabel: meta.label,
        scenarioTitle: prev.scenario.title,
        scenarioText: prev.scenario.scenarioText,
        questions: prev.scenario.questions,
        userAnswer: prev.answer,
        referenceAnswer: prev.scenario.referenceAnswer,
        selfRating: prev.selfRating as 1 | 2 | 3 | 4 | 5,
        aiEvaluation: null,
        retrospectiveNote: '',
        durationSeconds,
        completedAt: new Date().toISOString(),
        weekNumber: getISOWeekNumber(new Date()),
      }

      saveSession(session)
      return { phase: 'complete', session }
    })
  }, [])

  const handleStartEvaluate = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'reference_revealed' || prev.selfRating === null) return prev
      return {
        phase: 'evaluating',
        scenario: prev.scenario,
        answer: prev.answer,
        selfRating: prev.selfRating,
        evaluationText: '',
      }
    })
  }, [])

  // ── 串流评估 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'evaluating') return

    let cancelled = false
    const { scenario, answer } = state

    const refAnswerText = [
      scenario.referenceAnswer.frameworkUsed,
      ...scenario.referenceAnswer.sections.map(s => `${s.title}：${s.content}`),
    ].join('\n')

    async function stream() {
      try {
        const res = await fetch('/api/evaluate-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: scenario.method,
            scenarioText: scenario.scenarioText,
            questions: scenario.questions,
            userAnswer: answer,
            referenceAnswerText: refAnswerText,
          }),
        })

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}))
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done || cancelled) break

          const chunk = decoder.decode(value, { stream: true })
          if (chunk) {
            setState(prev =>
              prev.phase === 'evaluating'
                ? { ...prev, evaluationText: prev.evaluationText + chunk }
                : prev
            )
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '评估请求失败'
          setState(prev =>
            prev.phase === 'evaluating'
              ? { ...prev, evaluationText: `{"error": "${msg}"}` }
              : prev
          )
        }
      }
    }

    stream()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // ── 渲染 ──────────────────────────────────────────────────────────────────

  const stepIndex = currentStepIndex(state.phase)
  const totalSteps = STEPS.length - 1 // 不含 complete
  const methodMeta = state.phase !== 'loading' && state.phase !== 'complete'
    ? METHOD_META[(state as { scenario?: Scenario }).scenario?.method ?? method]
    : METHOD_META[method]

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* 顶部进度条（loading 和 complete 时隐藏） */}
      {state.phase !== 'loading' && state.phase !== 'complete' && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">{methodMeta.icon}</span>
            <span className="text-sm font-medium text-gray-600">{methodMeta.shortLabel ?? methodMeta.label}</span>
          </div>
          <span className="text-base font-bold text-gray-900 tabular-nums">
            {stepIndex + 1} / {totalSteps}
          </span>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Loading */}
        {state.phase === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            {fetchError ? (
              <div className="text-center space-y-4">
                <p className="text-base text-red-600 font-medium">{fetchError}</p>
                <Button
                  size="lg"
                  onClick={() => window.location.reload()}
                  className="w-full h-14 text-base"
                >
                  重新加载
                </Button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full border-4 border-gray-900 border-t-transparent animate-spin" />
                <p className="text-base text-gray-400">正在加载训练场景…</p>
              </>
            )}
          </div>
        )}

        {/* 阶段：展示场景 */}
        {state.phase === 'scenario_displayed' && (
          <MobileScenarioCard
            scenario={state.scenario}
            onReady={handleScenarioReady}
          />
        )}

        {/* 阶段：思考倒计时 */}
        {state.phase === 'thinking_gate' && (
          <MobileThinkingGate
            onReady={handleThinkingDone}
            totalSessions={totalSessions}
          />
        )}

        {/* 阶段：作答（含 answer_submitted 瞬态） */}
        {state.phase === 'question_revealed' && (
          <MobileQuestionReveal
            scenario={state.scenario}
            answer={state.answer}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleAnswerSubmit}
          />
        )}

        {state.phase === 'answer_submitted' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-gray-900 border-t-transparent animate-spin" />
          </div>
        )}

        {/* 阶段：参考答案 + 自评 */}
        {state.phase === 'reference_revealed' && (
          <MobileReferenceReveal
            scenario={state.scenario}
            userAnswer={state.answer}
            selfRating={state.selfRating}
            onSelfRatingChange={handleSelfRatingChange}
            onEvaluate={handleStartEvaluate}
            onSkipEvaluate={handleSkipEvaluate}
          />
        )}

        {/* 阶段：AI 评估串流 */}
        {state.phase === 'evaluating' && (
          <MobileEvaluationPanel
            evaluationText={state.evaluationText}
            isStreaming={
              state.evaluationText === '' || !isEvaluationComplete(state.evaluationText)
            }
            onComplete={handleEvaluationComplete}
          />
        )}

        {/* 完成界面 */}
        {state.phase === 'complete' && (
          <MobileCompletionScreen
            session={state.session}
            method={method}
          />
        )}
      </div>
    </div>
  )
}

// ── 辅助函数 ──────────────────────────────────────────────────────────────────

function isEvaluationComplete(text: string): boolean {
  if (!text.trim()) return false
  const trimmed = text.trim()
  return trimmed.endsWith('}') || trimmed.endsWith('```')
}
