'use client'

import { useLayout } from '@/context/LayoutContext'
import { HistoryPage } from '@/components/history/HistoryPage'
import { MobileHistoryPage } from '@/components/history/MobileHistoryPage'

export default function Page() {
  const { isMobile } = useLayout()
  return isMobile ? <MobileHistoryPage /> : <HistoryPage />
}
