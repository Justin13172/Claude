'use client'

import { useState, useEffect } from 'react'
import { CompletedSession } from '@/types'
import { getSessions } from '@/lib/storage'
import { HistoryList } from './HistoryList'
import { ExportButton } from './ExportButton'

export function HistoryPage() {
  const [sessions, setSessions] = useState<CompletedSession[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const all = getSessions()
    setSessions([...all].reverse()) // newest first
    setLoaded(true)
  }, [])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        加载中...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">训练记录</h1>
          <p className="text-gray-500 text-sm mt-1">共 {sessions.length} 条训练记录</p>
        </div>
        <ExportButton />
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-lg font-medium">还没有训练记录</p>
          <p className="text-sm mt-1">完成第一次训练后，记录将显示在这里</p>
        </div>
      ) : (
        <HistoryList sessions={sessions} />
      )}
    </div>
  )
}
