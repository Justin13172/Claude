import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { MethodId, Scenario } from '@/types'
import { CURATED_SCENARIOS } from '@/lib/scenarios'
import { getAIScenarioPrompt } from '@/lib/prompts'
import { fastModel } from '@/lib/ai-client'

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
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: '未配置 OPENROUTER_API_KEY，且精选案例已全部完成' },
        { status: 500 }
      )
    }

    const prompt = getAIScenarioPrompt(method, difficulty)
    const { text } = await generateText({
      model: fastModel,
      prompt,
      maxOutputTokens: 2000,
    })

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
    console.error('generate-scenario error:', error)
    return NextResponse.json({ error: '生成场景失败，请稍后重试' }, { status: 500 })
  }
}

