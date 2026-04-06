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

// 两个场景都用 Claude Opus 4.6
export const primaryModel = openrouter('anthropic/claude-opus-4.6')
export const fastModel = openrouter('anthropic/claude-opus-4.6')
