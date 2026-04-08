'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type LayoutMode = 'mobile' | 'desktop'

interface LayoutContextValue {
  mode: LayoutMode
  toggle: () => void
  isMobile: boolean
}

const LayoutContext = createContext<LayoutContextValue>({
  mode: 'desktop',
  toggle: () => {},
  isMobile: false,
})

const STORAGE_KEY = 'pst_layout_mode'

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<LayoutMode>('desktop')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 默认：屏幕宽度 < 640px 自动切移动端
    const stored = localStorage.getItem(STORAGE_KEY) as LayoutMode | null
    if (stored === 'mobile' || stored === 'desktop') {
      setMode(stored)
    } else {
      setMode(window.innerWidth < 640 ? 'mobile' : 'desktop')
    }
    setMounted(true)
  }, [])

  function toggle() {
    setMode(prev => {
      const next = prev === 'mobile' ? 'desktop' : 'mobile'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return (
    <LayoutContext.Provider value={{ mode, toggle, isMobile: mode === 'mobile' }}>
      <div style={mounted ? undefined : { visibility: 'hidden' }}>
        {children}
      </div>
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}
