import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MethodId, MethodMeta } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 获取 ISO 周数
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// 获取今天日期字符串 YYYY-MM-DD
export function getTodayString(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

// 格式化日期为中文
export function formatDateCN(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatDateTimeCN(dateStr: string): string {
  const date = new Date(dateStr)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${h}:${m}`
}

// 格式化秒数为可读时间
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) return `${mins}分钟`
  return `${mins}分${secs}秒`
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 方法元数据
export const METHOD_META: Record<MethodId, MethodMeta> = {
  'requirement-translation': {
    id: 'requirement-translation',
    label: '需求转化训练',
    shortLabel: '需求转化',
    description: '把功能需求翻译成问题定义，训练本质思考',
    icon: '🔄',
    color: 'bg-blue-500',
    estimatedMinutes: 20,
  },
  'product-teardown': {
    id: 'product-teardown',
    label: '产品拆解分析',
    shortLabel: '产品拆解',
    description: '系统拆解产品五大维度，训练产品观察力',
    icon: '🔍',
    color: 'bg-purple-500',
    estimatedMinutes: 30,
  },
  'roadmap-decisions': {
    id: 'roadmap-decisions',
    label: '路线图决策',
    shortLabel: '路线图决策',
    description: '明确不做什么及原因，训练优先级判断',
    icon: '🗺️',
    color: 'bg-orange-500',
    estimatedMinutes: 20,
  },
  'judgment-review': {
    id: 'judgment-review',
    label: '判断复盘记录',
    shortLabel: '判断复盘',
    description: '记录关键决策与假设，训练结构化判断',
    icon: '📋',
    color: 'bg-green-500',
    estimatedMinutes: 25,
  },
  'raw-user-data': {
    id: 'raw-user-data',
    label: '用户数据解读',
    shortLabel: '用户数据',
    description: '从原始用户反馈中提炼信号，训练洞察力',
    icon: '📊',
    color: 'bg-red-500',
    estimatedMinutes: 20,
  },
  'learning-process': {
    id: 'learning-process',
    label: '专家过程学习',
    shortLabel: '专家学习',
    description: '研究专家如何提问和定义问题，不只看结论',
    icon: '🧠',
    color: 'bg-yellow-500',
    estimatedMinutes: 15,
  },
}

// 训练结果标签
export const VERDICT_LABELS = {
  strength: { label: '优势项', color: 'text-green-600 bg-green-50' },
  developing: { label: '发展中', color: 'text-yellow-600 bg-yellow-50' },
  gap: { label: '待提升', color: 'text-red-600 bg-red-50' },
}
