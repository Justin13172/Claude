import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { MethodId } from '@/types'
import { getEvaluationPrompt } from '@/lib/prompts'
import { primaryModel } from '@/lib/ai-client'

export async function POST(req: NextRequest) {
  try {
    const { method, scenarioText, questions, userAnswer, referenceAnswerText } = await req.json() as {
      method: MethodId
      scenarioText: string
      questions: string[]
      userAnswer: string
      referenceAnswerText: string
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: '未配置 OPENROUTER_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const prompt = getEvaluationPrompt(method, scenarioText, questions, userAnswer, referenceAnswerText)

    const result = streamText({
      model: primaryModel,
      prompt,
      maxOutputTokens: 1500,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('evaluate-response error:', error)
    return new Response(JSON.stringify({ error: '评估失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
