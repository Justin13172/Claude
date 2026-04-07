'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CompletedSession } from '@/types'
import { getSessions } from '@/lib/storage'
import { useLayout } from '@/context/LayoutContext'
import { SessionDetail } from '@/components/history/SessionDetail'
import { METHOD_META } from '@/lib/utils'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default function SessionDetailPage({ params }: Props) {
  const { sessionId } = use(params)
  const { isMobile } = useLayout()
  const router = useRouter()
  const [session, setSession] = useState<CompletedSession | null | undefined>(undefined)

  useEffect(() => {
    const all = getSessions()
    const found = all.find(s => s.id === sessionId)
    setSession(found ?? null)
  }, [sessionId])

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (session === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-4xl">🔍</p>
        <p className="text-lg font-semibold text-gray-700">找不到该训练记录</p>
        <Link href="/history" className="text-sm text-blue-600 hover:underline">
          返回训练记录
        </Link>
      </div>
    )
  }

  const meta = METHOD_META[session.method]

  return (
    <div className={isMobile ? 'p-4 pb-24' : 'max-w-3xl mx-auto'}>
      {/* 顶部导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/history" className="hover:text-gray-600 transition-colors">
          训练记录
        </Link>
        <span>›</span>
        <span className="text-gray-700 font-medium truncate">
          {meta?.icon} {session.scenarioTitle}
        </span>
      </div>

      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          {session.scenarioTitle}
        </h1>
      </div>

      {/* 详情 */}
      <SessionDetail session={session} showReplay />
    </div>
  )
}
