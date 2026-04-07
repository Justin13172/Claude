import { NextRequest, NextResponse } from 'next/server'
import { MethodId, ReferenceAnswer } from '@/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { method, scenarioText, questions } = await req.json() as {
      method: MethodId
      scenarioText: string
      questions: string[]
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: '未配置 OPENROUTER_API_KEY' }, { status: 500 })
    }

    const prompt = `你是一位有15年经验的顶级产品总监，正在为产品经理训练系统提供参考答案。

**场景描述：**
${scenarioText}

**训练问题：**
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

**训练方法：** ${method}

请提供一个高质量的结构化参考答案，要求：
1. 使用至少一个命名框架（JTBD、OST、ICE、HEART、5W1H等）
2. 答案分为3-4个结构化章节
3. 每个章节说明"为什么这样思考"
4. 指出高级PM常犯的3个典型错误
5. 推荐1-2个延伸阅读资源，并为每项提供30字以内的核心价值说明（description字段）

以JSON格式返回：
\`\`\`json
{
  "frameworkUsed": "框架名称",
  "sections": [
    {
      "title": "章节标题",
      "content": "详细内容（100-150字）",
      "whyThisMatters": "为什么重要（50字内）"
    }
  ],
  "whatGoodLooksLike": "专家级水准是什么样子（80-100字）",
  "commonMistakes": ["错误1", "错误2", "错误3"],
  "furtherReading": [
    {"title": "书名或文章名", "author": "作者", "description": "该资源与本题的核心关联及最值得学习的观点（30字内）"}
  ]
}
\`\`\``

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
      return NextResponse.json({ error: '参考答案解析失败' }, { status: 500 })
    }

    const referenceAnswer: ReferenceAnswer = JSON.parse(jsonMatch[1])
    return NextResponse.json({ referenceAnswer })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('generate-reference error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
