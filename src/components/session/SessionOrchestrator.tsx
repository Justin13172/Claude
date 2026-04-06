'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Scenario, CompletedSession, MethodId, AIEvaluation } from '@/types'
import { saveSession, getSessions } from '@/lib/storage'
import { generateId, getISOWeekNumber, METHOD_META, VERDICT_LABELS } from '@/lib/utils'
import { ScenarioCard } from './ScenarioCard'
import { ThinkingGate } from './ThinkingGate'
import { QuestionReveal } from './QuestionReveal'
import { ReferenceReveal } from './ReferenceReveal'
import { EvaluationPanel } from './EvaluationPanel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ── Discriminated-union state machine ─────────────────────────────────────────

type SessionState =
  | { phase: 'loading' }
  | { phase: 'scenario_displayed'; scenario: Scenario }
  | { phase: 'thinking_gate'; scenario: Scenario }
  | { phase: 'question_revealed'; scenario: Scenario; answer: string }
  | { phase: 'answer_submitted'; scenario: Scenario; answer: string }
  | { phase: 'reference_revealed'; scenario: Scenario; answer: string; selfRating: number | null }
  | { phase: 'evaluating'; scenario: Scenario; answer: string; selfRating: number; evaluationText: string }
  | { phase: 'complete'; session: CompletedSession }

// ── Progress steps (for the top bar) ──────────────────────────────────────────

const STEPS = [
  { id: 'scenario_displayed', label: '阅读场景' },
  { id: 'thinking_gate',      label: '初步思考' },
  { id: 'question_revealed',  label: '作答' },
  { id: 'reference_revealed', label: '对照参考' },
  { id: 'evaluating',         label: 'AI 评估' },
  { id: 'complete',           label: '完成' },
] as const

type StepId = (typeof STEPS)[number]['id']

function currentStepIndex(phase: SessionState['phase']): number {
  const map: Record<SessionState['phase'], number> = {
    loading:            -1,
    scenario_displayed:  0,
    thinking_gate:       1,
    question_revealed:   2,
    answer_submitted:    2, // still in the answering step
    reference_revealed:  3,
    evaluating:          4,
    complete:            5,
  }
  return map[phase] ?? 0
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface SessionOrchestratorProps {
  method: MethodId
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionOrchestrator({ method }: SessionOrchestratorProps) {
  const [state, setState] = useState<SessionState>({ phase: 'loading' })
  const [fetchError, setFetchError] = useState<string | null>(null)
  const startTimeRef = useRef<Date>(new Date())
  const totalSessions = getSessions().length

  // ── Fetch scenario on mount ──────────────────────────────────────────────────
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

  // ── Transition helpers (strict forward-only) ─────────────────────────────────

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
      prev.phase === 'question_revealed'
        ? { ...prev, answer }
        : prev
    )
  }, [])

  const handleAnswerSubmit = useCallback(() => {
    setState(prev =>
      prev.phase === 'question_revealed'
        ? { phase: 'answer_submitted', scenario: prev.scenario, answer: prev.answer }
        : prev
    )
    // Immediately move to reference_revealed — answer_submitted is transient
    setState(prev =>
      prev.phase === 'answer_submitted'
        ? { phase: 'reference_revealed', scenario: prev.scenario, answer: prev.answer, selfRating: null }
        : prev
    )
  }, [])

  const handleSelfRatingChange = useCallback((rating: number) => {
    setState(prev =>
      prev.phase === 'reference_revealed'
        ? { ...prev, selfRating: rating }
        : prev
    )
  }, [])

  // Called when AI evaluation streaming completes
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

  // Skip AI evaluation — complete immediately
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

  // Start AI evaluation — open streaming connection
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

  // ── Streaming effect (runs when phase becomes 'evaluating') ──────────────────
  useEffect(() => {
    if (state.phase !== 'evaluating') return

    let cancelled = false
    const { scenario, answer } = state

    const refAnswerText = [
      scenario.referenceAnswer.frameworkUsed,
      ...scenario.referenceAnswer.sections.map(
        s => `${s.title}：${s.content}`
      ),
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

          // toTextStreamResponse sends raw text chunks — append directly
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
          // Surface a parse-friendly error JSON so EvaluationPanel can display it
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
  // Intentionally depend only on phase entering 'evaluating'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // ── Render ───────────────────────────────────────────────────────────────────

  const stepIndex = currentStepIndex(state.phase)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Progress bar ── */}
      {state.phase !== 'loading' && state.phase !== 'complete' && (
        <div className="sticky top-14 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-2.5">
            <div className="flex items-center gap-0">
              {STEPS.filter(s => s.id !== 'complete').map((step, i) => {
                const isActive = i === stepIndex
                const isDone = i < stepIndex
                return (
                  <div key={step.id} className="flex items-center flex-1 min-w-0">
                    <div className={cn(
                      'flex items-center gap-1.5 text-xs font-medium truncate',
                      isDone && 'text-primary',
                      isActive && 'text-foreground font-semibold',
                      !isDone && !isActive && 'text-muted-foreground'
                    )}>
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0',
                        isDone && 'bg-primary text-primary-foreground',
                        isActive && 'bg-foreground text-background',
                        !isDone && !isActive && 'bg-muted text-muted-foreground'
                      )}>
                        {isDone ? '✓' : i + 1}
                      </span>
                      <span className="hidden sm:block">{step.label}</span>
                    </div>
                    {i < STEPS.length - 2 && (
                      <div className={cn(
                        'flex-1 h-0.5 mx-1',
                        i < stepIndex ? 'bg-primary' : 'bg-muted'
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Loading */}
        {state.phase === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            {fetchError ? (
              <div className="text-center space-y-4">
                <p className="text-destructive font-medium">{fetchError}</p>
                <Button onClick={() => window.location.reload()}>
                  重新加载
                </Button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-muted-foreground text-sm">正在加载训练场景…</p>
              </>
            )}
          </div>
        )}

        {/* Phase: scenario displayed */}
        {state.phase === 'scenario_displayed' && (
          <ScenarioCard
            scenario={state.scenario}
            onReady={handleScenarioReady}
          />
        )}

        {/* Phase: thinking gate */}
        {state.phase === 'thinking_gate' && (
          <ThinkingGate
            onReady={handleThinkingDone}
            totalSessions={totalSessions}
          />
        )}

        {/* Phase: question revealed (and answer being written) */}
        {state.phase === 'question_revealed' && (
          <QuestionReveal
            scenario={state.scenario}
            answer={state.answer}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleAnswerSubmit}
          />
        )}

        {/* Phase: answer submitted (transient — immediately moves forward) */}
        {state.phase === 'answer_submitted' && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Phase: reference revealed */}
        {state.phase === 'reference_revealed' && (
          <ReferenceReveal
            scenario={state.scenario}
            userAnswer={state.answer}
            selfRating={state.selfRating}
            onSelfRatingChange={handleSelfRatingChange}
            onEvaluate={handleStartEvaluate}
            onSkipEvaluate={handleSkipEvaluate}
          />
        )}

        {/* Phase: evaluating (streaming) */}
        {state.phase === 'evaluating' && (
          <EvaluationPanel
            evaluationText={state.evaluationText}
            isStreaming={state.evaluationText === '' || !isEvaluationComplete(state.evaluationText)}
            onComplete={handleEvaluationComplete}
          />
        )}

        {/* Phase: complete */}
        {state.phase === 'complete' && (
          <CompletionScreen
            session={state.session}
            method={method}
          />
        )}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Heuristic: treat streaming as complete once the text contains a closing brace
 * and is no longer empty. The EvaluationPanel will attempt to parse the JSON.
 */
function isEvaluationComplete(text: string): boolean {
  if (!text.trim()) return false
  // The prompt asks for pure JSON; completion is signaled by a closing brace
  const trimmed = text.trim()
  return trimmed.endsWith('}') || trimmed.endsWith('```')
}

// ── Completion screen ──────────────────────────────────────────────────────────

const SELF_RATING_LABELS: Record<number, string> = {
  1: '差距较大',
  2: '有所欠缺',
  3: '基本到位',
  4: '较为出色',
  5: '完全准确',
}

function CompletionScreen({
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
    <div className="max-w-lg mx-auto py-12 flex flex-col items-center gap-8 text-center">
      <div className="space-y-3">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold">训练完成！</h1>
        <p className="text-muted-foreground text-sm">
          {session.scenarioTitle} — {session.methodLabel}
        </p>
      </div>

      {/* 成绩摘要卡 */}
      <div className="w-full rounded-xl border bg-card p-6 space-y-4 text-left">
        {/* 自我评分 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">自我评分</span>
          <span className="font-semibold">
            {session.selfRating} 分 — {SELF_RATING_LABELS[session.selfRating]}
          </span>
        </div>

        {/* AI 评级 */}
        {verdictMeta && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">AI 评级</span>
            <span className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-sm font-bold',
              verdictMeta.color
            )}>
              {verdictMeta.label}
            </span>
          </div>
        )}

        {/* AI 总评 */}
        {session.aiEvaluation?.overallSummary && (
          <p className="text-sm leading-relaxed text-foreground border-t pt-3">
            {session.aiEvaluation.overallSummary}
          </p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link href="/" className="sm:flex-1">
          <Button variant="outline" size="lg" className="w-full">
            返回仪表盘
          </Button>
        </Link>
        <Button
          size="lg"
          className="sm:flex-1"
          onClick={() => window.location.reload()}
        >
          再训练一次
        </Button>
      </div>
    </div>
  )
}
