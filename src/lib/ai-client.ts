import { createOpenAI } from '@ai-sdk/openai'

// OpenRouter 兼容 OpenAI 格式，model 格式为 "provider/model-id"
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  headers: {
    'HTTP-Referer': 'https://product-sense-trainer-xi.vercel.app',
    'X-Title': '产品Sense训练系统',
  },
})

// 主力模型：Claude Opus 4.6（最强推理）
export const primaryModel = openrouter('anthropic/claude-opus-4')

// 轻量模型：Claude Sonnet 4.6（生成场景用，速度快）
export const fastModel = openrouter('anthropic/claude-sonnet-4-5')
