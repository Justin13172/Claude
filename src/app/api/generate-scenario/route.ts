import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { MethodId, Scenario } from '@/types'
import { CURATED_SCENARIOS } from '@/lib/scenarios'
import { getAIScenarioPrompt } from '@/lib/prompts'

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
      // 随机选一个未做过的精选案例
      const scenario = unseen[Math.floor(Math.random() * unseen.length)]
      return NextResponse.json({ scenario })
    }

    // 精选案例已全部完成，使用 AI 动态生成
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: '未配置 ANTHROPIC_API_KEY，且精选案例已全部完成' },
        { status: 500 }
      )
    }

    const anthropic = createAnthropic({ apiKey })
    const prompt = getAIScenarioPrompt(method, difficulty)

    const { text } = await generateText({
      model: anthropic('claude-opus-4-5'),
      prompt,
      maxOutputTokens: 2000,
    })

    // 解析 AI 返回的 JSON
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
