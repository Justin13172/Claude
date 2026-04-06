import { MethodId } from '@/types'
import { SessionOrchestrator } from '@/components/session/SessionOrchestrator'
import { METHOD_META } from '@/lib/utils'
import { notFound } from 'next/navigation'

const VALID_METHODS: MethodId[] = [
  'requirement-translation',
  'product-teardown',
  'roadmap-decisions',
  'judgment-review',
  'raw-user-data',
  'learning-process',
]

interface Props {
  params: Promise<{ method: string }>
}

export default async function SessionPage({ params }: Props) {
  const { method } = await params

  if (!VALID_METHODS.includes(method as MethodId)) {
    notFound()
  }

  const methodId = method as MethodId
  const meta = METHOD_META[methodId]

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span>今日训练</span>
          <span>›</span>
          <span>{meta.icon} {meta.label}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{meta.label}</h1>
        <p className="text-gray-600 mt-1">{meta.description}</p>
      </div>

      <SessionOrchestrator method={methodId} />
    </div>
  )
}

export async function generateStaticParams() {
  return VALID_METHODS.map(method => ({ method }))
}
