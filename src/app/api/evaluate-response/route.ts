import { NextRequest } from 'next/server'
import { MethodId } from '@/types'
import { getEvaluationPrompt } from '@/lib/prompts'

// 增加函数超时时间（Vercel Hobby 最大 60s，Pro 最大 300s）
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { method, scenarioText, questions, userAnswer, referenceAnswerText } = await req.json() as {
      method: MethodId
      scenarioText: string
      questions: string[]
      userAnswer: string
      referenceAnswerText: string
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: '未配置 OPENROUTER_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const prompt = getEvaluationPrompt(method, scenarioText, questions, userAnswer, referenceAnswerText)

    // 直接调用 OpenRouter Chat Completions（绕过 AI SDK 的端点选择问题）
    const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
        max_tokens: 1500,
        stream: true,
      }),
    })

    if (!openrouterRes.ok || !openrouterRes.body) {
      const errText = await openrouterRes.text()
      return new Response(JSON.stringify({ error: `OpenRouter error ${openrouterRes.status}: ${errText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 将 OpenRouter SSE 流转成纯文本流返回给客户端
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = openrouterRes.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue
              try {
                const json = JSON.parse(data)
                const text = json.choices?.[0]?.delta?.content
                if (text) {
                  controller.enqueue(encoder.encode(text))
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('evaluate-response error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
