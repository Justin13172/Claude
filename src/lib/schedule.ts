import { MethodId, TodaySchedule, DayOfWeek } from '@/types'
import { METHOD_META } from '@/lib/utils'
import { getTodayCompletedMethods } from '@/lib/storage'

// ─── Weekly schedule definition ───────────────────────────────────────────────

interface ScheduleDay {
  method: MethodId
  estimatedMinutes: number
}

const WEEKLY_SCHEDULE: Record<DayOfWeek, ScheduleDay> = {
  0: { method: 'judgment-review',        estimatedMinutes: 15 },
  1: { method: 'requirement-translation', estimatedMinutes: 20 },
  2: { method: 'raw-user-data',           estimatedMinutes: 20 },
  3: { method: 'judgment-review',         estimatedMinutes: 25 },
  4: { method: 'roadmap-decisions',       estimatedMinutes: 20 },
  5: { method: 'learning-process',        estimatedMinutes: 15 },
  6: { method: 'product-teardown',        estimatedMinutes: 30 },
}

// Saturday product-teardown rotating context (1-indexed week of month)
const TEARDOWN_CONTEXTS: Record<1 | 2 | 3 | 4, string> = {
  1: '第1周：消费级 App（社交、娱乐）',
  2: '第2周：B2B SaaS 工具',
  3: '第3周：软硬件结合产品',
  4: '第4周：跨行业拆解（医疗、金融、物流）',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns which week of the month the given date falls in (1–4).
 * Week 1 = days 1–7, Week 2 = days 8–14, Week 3 = days 15–21, Week 4 = days 22+.
 */
export function getWeekOfMonth(date: Date): 1 | 2 | 3 | 4 {
  const day = date.getDate()
  if (day <= 7)  return 1
  if (day <= 14) return 2
  if (day <= 21) return 3
  return 4
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function getTodaySchedule(): TodaySchedule {
  const today = new Date()
  const dayOfWeek = today.getDay() as DayOfWeek
  const { method, estimatedMinutes } = WEEKLY_SCHEDULE[dayOfWeek]

  const meta = METHOD_META[method]

  // Determine session context
  let sessionContext: string
  if (method === 'product-teardown') {
    const weekOfMonth = getWeekOfMonth(today)
    sessionContext = TEARDOWN_CONTEXTS[weekOfMonth]
  } else {
    sessionContext = meta.description
  }

  // Check completion
  const completedToday = getTodayCompletedMethods()
  const isCompleted = completedToday.has(method)

  return {
    method,
    methodLabel: meta.label,
    methodDescription: meta.description,
    estimatedMinutes,
    sessionContext,
    isCompleted,
    icon: meta.icon,
  }
}
