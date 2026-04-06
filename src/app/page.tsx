'use client'

import { useLayout } from '@/context/LayoutContext'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { MobileDashboard } from '@/components/dashboard/MobileDashboard'

export default function HomePage() {
  const { isMobile } = useLayout()
  return isMobile ? <MobileDashboard /> : <Dashboard />
}
