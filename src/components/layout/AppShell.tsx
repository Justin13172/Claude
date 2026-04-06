'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLayout } from '@/context/LayoutContext'
import { MobileAppShell } from './MobileAppShell'

const navItems = [
  { href: '/', label: '今日训练', icon: '🏠' },
  { href: '/history', label: '训练记录', icon: '📚' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isMobile, toggle } = useLayout()

  // 移动端布局
  if (isMobile) {
    return <MobileAppShell>{children}</MobileAppShell>
  }

  // 桌面端布局
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-semibold text-gray-900">产品 Sense 训练系统</span>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={toggle}
              className="ml-2 px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 rounded-md"
              title="切换手机版"
            >
              📱
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

