// 训练方法 ID
export type MethodId =
  | 'requirement-translation' // 方法①：需求转化
  | 'product-teardown'        // 方法②：产品拆解
  | 'roadmap-decisions'       // 方法③：路线图决策
  | 'judgment-review'         // 方法④：判断复盘
  | 'raw-user-data'           // 方法⑤：原始用户数据
  | 'learning-process'        // 方法⑥：专家过程学习

// 内容层级
export type ScenarioTier = 'curated' | 'ai-generated'

// 难度
export type Difficulty = 'foundation' | 'advanced' | 'expert'

// 一周中的某天（0=周日）
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

// 会话阶段（严格单向状态机）
export type SessionPhase =
  | 'loading'
  | 'scenario_displayed'
  | 'thinking_gate'
  | 'question_revealed'
  | 'answering'
  | 'answer_submitted'
  | 'reference_revealed'
  | 'evaluating'
  | 'complete'

// 参考答案结构
export interface ReferenceAnswer {
  frameworkUsed: string
  sections: {
    title: string
    content: string
    whyThisMatters: string
  }[]
  whatGoodLooksLike: string
  commonMistakes: string[]
  furtherReading: {
    title: string
    author: string
    url?: string
    description?: string  // 核心价值简介
  }[]
}

// 训练场景
export interface Scenario {
  id: string
  method: MethodId
  tier: ScenarioTier
  source: string           // 引用来源，确保可追溯
  title: string            // 简短标题
  scenarioText: string     // 第一阶段展示（不含问题）
  questions: string[]      // 第二阶段揭示
  referenceAnswer: ReferenceAnswer
  difficulty: Difficulty
  tags: string[]
}

// AI 评估结果
export interface AIEvaluation {
  dimensions: {
    name: string
    score: 1 | 2 | 3 | 4 | 5
    rationale: string
  }[]
  overallVerdict: 'strength' | 'developing' | 'gap'
  overallSummary: string
  generatedAt: string
}

// 完成的训练会话（持久化到 localStorage）
export interface CompletedSession {
  id: string
  scenarioId: string
  method: MethodId
  methodLabel: string
  scenarioTitle: string
  scenarioText: string        // 快照，防止原题被修改后丢失
  questions: string[]         // 快照
  userAnswer: string
  referenceAnswer: ReferenceAnswer  // 快照
  selfRating: 1 | 2 | 3 | 4 | 5
  aiEvaluation: AIEvaluation | null
  retrospectiveNote: string   // "下次我会怎么做不同"
  durationSeconds: number
  completedAt: string         // ISO datetime
  weekNumber: number          // ISO 周数
}

// localStorage 存储结构
export interface StorageSchema {
  sessions: CompletedSession[]
  lastUpdated: string
  schemaVersion: number
}

// 今日训练日程
export interface TodaySchedule {
  method: MethodId
  methodLabel: string
  methodDescription: string
  estimatedMinutes: number
  sessionContext: string       // 如 "第1周：消费级 App"
  isCompleted: boolean
  icon: string
}

// 日程条目
export interface ScheduleEntry {
  day: DayOfWeek
  method: MethodId
  sessionType: 'weekly' | 'monthly'
  estimatedMinutes: number
}

// 方法元数据
export interface MethodMeta {
  id: MethodId
  label: string
  shortLabel: string
  description: string
  icon: string
  color: string
  estimatedMinutes: number
}
