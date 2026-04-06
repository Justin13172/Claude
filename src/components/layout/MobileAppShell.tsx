'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayout } from '@/context/LayoutContext'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: '今日训练', icon: HomeIcon },
  { href: '/history', label: '训练记录', icon: HistoryIcon },
]

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { toggle } = useLayout()
  const isSession = pathname.startsWith('/session')

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">
      {/* 顶部状态栏 */}
      {!isSession && (
        <header className="bg-white border-b border-gray-100 px-4 pt-safe-top flex items-center justify-between h-12 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🎯</span>
            <span className="font-semibold text-sm text-gray-900">产品 Sense 训练</span>
          </div>
          <button
            onClick={toggle}
            className="text-xs text-gray-400 px-2 py-1 rounded-md hover:bg-gray-100"
          >
            切桌面版
          </button>
        </header>
      )}

      {/* 主内容区（可滚动） */}
      <main className={cn(
        'flex-1 overflow-y-auto',
        !isSession && 'pb-safe-bottom'
      )}>
        {children}
      </main>

      {/* 底部导航（训练中隐藏） */}
      {!isSession && (
        <nav className="bg-white border-t border-gray-200 pb-safe-bottom shrink-0">
          <div className="flex">
            {tabs.map(tab => {
              const isActive = pathname === tab.href
              const Icon = tab.icon
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  )}
                >
                  <Icon className={cn('w-6 h-6', isActive && 'fill-blue-600')} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
