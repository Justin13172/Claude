import { NextRequest, NextResponse } from 'next/server'
import { MethodId, Scenario } from '@/types'
import { CURATED_SCENARIOS } from '@/lib/scenarios'
import { getAIScenarioPrompt } from '@/lib/prompts'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { method, completedScenarioIds = [], difficulty = 'advanced' } = await req.json() as {
      method: MethodId
      completedScenarioIds: string[]
      difficulty?: string
    }

    // 优先使用精选案例中未做过的
    const methodScenarios = CURATED_SCENARIOS.filter(s => s.method === method)
    const unseen = methodScenarios.filter(s => !completedScenarioIds.includes(s.id))

    if (unseen.length > 0) {
      const scenario = unseen[Math.floor(Math.random() * unseen.length)]
      return NextResponse.json({ scenario })
    }

    // 精选案例已全部完成，使用 AI 动态生成
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: '未配置 OPENROUTER_API_KEY，且精选案例已全部完成' },
        { status: 500 }
      )
    }

    const prompt = getAIScenarioPrompt(method, difficulty)
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://product-sense-trainer-xi.vercel.app',
        'X-Title': 'Product Sense Trainer',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.6',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: `OpenRouter error ${res.status}: ${errText}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''

    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 生成场景解析失败' }, { status: 500 })
    }

    const generatedData = JSON.parse(jsonMatch[1])
    const scenario: Scenario = {
      ...generatedData,
      id: `ai-${method}-${Date.now()}`,
      tier: 'ai-generated',
    }

    return NextResponse.json({ scenario })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('generate-scenario error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

