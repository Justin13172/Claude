import { createOpenAI } from '@ai-sdk/openai'

// OpenRouter 兼容 OpenAI Chat Completions 格式（不支持 /v1/responses）
// compatibility: 'compatible' 强制使用 /v1/chat/completions 端点
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  headers: {
    'HTTP-Referer': 'https://product-sense-trainer-xi.vercel.app',
    'X-Title': 'Product Sense Trainer',
  },
})

// 必须用 .chat() 强制走 /v1/chat/completions，OpenRouter 不支持 /v1/responses
export const primaryModel = openrouter.chat('anthropic/claude-opus-4.6')
export const fastModel = openrouter.chat('anthropic/claude-opus-4.6')
