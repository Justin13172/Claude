'use client'

import { useEffect, useState } from 'react'
import { getSyncId, setSyncId, generateSyncId, syncSessions } from '@/lib/sync'
import { getSessions } from '@/lib/storage'
import { CompletedSession } from '@/types'
import { cn } from '@/lib/utils'

interface SyncPanelProps {
  onSynced?: (sessions: CompletedSession[]) => void
  compact?: boolean  // smaller version for mobile header
}

export function SyncPanel({ onSynced, compact = false }: SyncPanelProps) {
  const [syncId, setSyncIdState]   = useState<string | null>(null)
  const [inputCode, setInputCode]  = useState('')
  const [status, setStatus]        = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [message, setMessage]      = useState('')
  const [showInput, setShowInput]  = useState(false)
  const [copied, setCopied]        = useState(false)
  const [mounted, setMounted]      = useState(false)

  useEffect(() => {
    setMounted(true)
    setSyncIdState(getSyncId())
  }, [])

  if (!mounted) return null

  function handleGenerate() {
    const id = generateSyncId()
    setSyncIdState(id)
    setShowInput(false)
  }

  function handleUseCode() {
    const code = inputCode.trim().toUpperCase()
    if (code.length < 6) {
      setMessage('同步码至少6位')
      setStatus('error')
      return
    }
    setSyncId(code)
    setSyncIdState(code)
    setShowInput(false)
    setInputCode('')
    setMessage('已切换同步码')
    setStatus('success')
    setTimeout(() => setStatus('idle'), 2000)
  }

  async function handleSync() {
    if (!syncId) return
    setStatus('syncing')
    setMessage('')
    try {
      const local = getSessions()
      const result = await syncSessions(syncId, local)

      // Persist merged sessions to localStorage
      if (result.merged.length > local.length) {
        // Only write if there are new sessions from remote
        localStorage.setItem('pst_sessions', JSON.stringify(result.merged))
        onSynced?.(result.merged)
      }

      const added = result.merged.length - local.length
      setMessage(added > 0 ? `同步完成，新增 ${added} 条记录` : '同步完成，数据已是最新')
      setStatus('success')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '同步失败')
      setStatus('error')
    }
    setTimeout(() => setStatus('idle'), 4000)
  }

  async function handleCopy() {
    if (!syncId) return
    await navigator.clipboard.writeText(syncId).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {syncId ? (
          <>
            <button
              onClick={handleSync}
              disabled={status === 'syncing'}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                status === 'syncing'  ? 'bg-blue-50 text-blue-400'   :
                status === 'success'  ? 'bg-green-50 text-green-600' :
                status === 'error'    ? 'bg-red-50 text-red-600'     :
                'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {status === 'syncing' ? '⟳ 同步中…' : status === 'success' ? '✓ 已同步' : status === 'error' ? '✗ 失败' : '⟳ 同步'}
            </button>
            <span className="font-mono text-[10px] text-gray-400">{syncId}</span>
          </>
        ) : (
          <button
            onClick={handleGenerate}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
          >
            启用跨设备同步
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-gray-700">跨设备同步</h3>
      <p className="mb-4 text-xs text-gray-400">在多台设备上使用同一同步码，训练记录将自动合并</p>

      {syncId ? (
        <div className="flex flex-col gap-3">
          {/* 当前同步码 */}
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
            <span className="text-xs text-gray-500">同步码：</span>
            <span className="flex-1 font-mono text-sm font-semibold tracking-widest text-gray-800">
              {syncId}
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>

          {/* 操作按钮行 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSync}
              disabled={status === 'syncing'}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                status === 'syncing'
                  ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
              )}
            >
              {status === 'syncing' ? '同步中…' : '立即同步'}
            </button>
            <button
              onClick={() => setShowInput(v => !v)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50"
            >
              换同步码
            </button>
          </div>

          {/* 输入新同步码 */}
          {showInput && (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                placeholder="输入其他设备的同步码"
                maxLength={12}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={handleUseCode}
                className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                确认
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGenerate}
            className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600 active:bg-blue-700"
          >
            生成同步码
          </button>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">或</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              placeholder="输入已有同步码"
              maxLength={12}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={handleUseCode}
              className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              使用
            </button>
          </div>
        </div>
      )}

      {/* Status message */}
      {message && (
        <p className={cn(
          'mt-3 text-xs',
          status === 'error' ? 'text-red-500' : 'text-green-600',
        )}>
          {message}
        </p>
      )}

      <p className="mt-4 text-[10px] text-gray-300 leading-relaxed">
        同步码是你数据的唯一标识，请妥善保管，不要分享给陌生人。数据在服务器保留90天。
      </p>
    </div>
  )
}
