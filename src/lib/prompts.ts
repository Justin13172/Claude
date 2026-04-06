import { MethodId } from '@/types'
import { RUBRICS } from '@/lib/rubrics'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const METHOD_LABELS: Record<MethodId, { label: string; description: string }> = {
  'requirement-translation': {
    label: '需求转化',
    description:
      '将外部功能需求转化为用户问题陈述，分离问题与方案，识别假设',
  },
  'product-teardown': {
    label: '产品拆解',
    description:
      '系统性拆解一款产品的用户体验设计，涵盖引导、首次体验、决策节点、摩擦点与惊喜细节',
  },
  'roadmap-decisions': {
    label: '路线图决策',
    description:
      '说明不将某需求纳入路线图的理由，包括机会成本、战略对齐与干系人沟通',
  },
  'judgment-review': {
    label: '判断复盘',
    description:
      '回顾一个产品决策，显式化假设，诚实分析判断失误，并提炼可操作的改进点',
  },
  'raw-user-data': {
    label: '原始用户数据解读',
    description:
      '从原始用户反馈或调研数据中分离信号与噪声，进行根因分析，并确定下一步验证方向',
  },
  'learning-process': {
    label: '专家过程学习',
    description:
      '分析专家处理产品问题的思维过程，提炼可迁移原则，并与自身方法进行对比',
  },
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Build the evaluation prompt for a given method, scenario, and user answer.
 * The returned string is sent directly to Claude as the user message.
 */
export function getEvaluationPrompt(
  method: MethodId,
  scenarioText: string,
  questions: string[],
  userAnswer: string,
  referenceAnswer: string,
): string {
  const dimensions = RUBRICS[method]

  const dimensionBlock = dimensions
    .map(
      (d, i) =>
        `维度 ${i + 1}：${d.name}\n  5分标准：${d.description}`,
    )
    .join('\n\n')

  const questionBlock = questions
    .map((q, i) => `问题 ${i + 1}：${q}`)
    .join('\n')

  return `你是一位经验丰富的产品评估专家，正在评估一位高级 PM 的训练作答。

---
## 训练方法
${METHOD_LABELS[method].label}

## 训练场景
${scenarioText}

## 作答题目
${questionBlock}

## 学员作答
${userAnswer}

## 参考答案
${referenceAnswer}

---
## 评估维度（共 ${dimensions.length} 个，每个维度满分 5 分）

${dimensionBlock}

---
## 评分要求

请按以下步骤评分：

1. 对每个维度给出 1–5 的整数评分，并附上**一句话**说明理由（直接指向学员作答中的具体内容）。
2. 给出整体评级：
   - **strength**（优势项）：大部分维度达到 4–5 分，整体表现出专家水准
   - **developing**（发展中）：部分维度较强，但仍有明显提升空间
   - **gap**（待提升）：多个维度低于 3 分，需要系统性练习
3. 给出 2–3 句整体评价，说明学员最突出的优点与最需改进的方向。

**评分标准严格，5 分代表真正的专家水准，不要轻易给高分。**

---
## 输出格式

请**仅输出**如下 JSON，不要添加任何额外文字或 Markdown 代码块：

{
  "dimensions": [
    {"name": "维度名称", "score": 4, "rationale": "一句话理由"}
  ],
  "overallVerdict": "developing",
  "overallSummary": "总体评价"
}`
}

/**
 * Build a prompt for generating a new AI scenario when curated ones are exhausted.
 * The returned string is sent directly to Claude as the user message.
 */
export function getAIScenarioPrompt(method: MethodId, difficulty: string): string {
  const { label, description } = METHOD_LABELS[method]

  const difficultyLabel: Record<string, string> = {
    foundation: '基础（foundation）—— 情境清晰，问题直接，适合入门练习',
    advanced: '进阶（advanced）—— 情境有一定复杂度，需要综合判断',
    expert: '专家（expert）—— 情境模糊或存在利益冲突，需要高阶思维',
  }

  return `你是一位资深产品课程设计专家，负责为 PM 训练营创作高质量练习场景。

---
## 当前训练方法
**${label}**
方法描述：${description}

## 难度要求
${difficultyLabel[difficulty] ?? difficulty}

---
## 场景创作要求

请创作一个真实感强的训练场景，必须满足：

1. **真实公司/产品**：使用真实存在的公司名称（如美团、Figma、Notion、拼多多等），不要虚构公司。
2. **具体用户细分**：场景中必须出现具体的用户群体（如"二三线城市的宝妈"、"刚入职的产品经理"），而非泛泛的"用户"。
3. **真实业务背景**：情境基于该公司真实可能面临的产品挑战，有商业逻辑支撑。
4. **问题设计**：2–3 个递进式问题，引导学员展开深度思考。
5. **参考答案**：必须包含至少一个具名框架（如 JTBD、Kano 模型、影响力地图、双钻模型等），并分节展示优秀答案的结构。

---
## 输出格式

请**仅输出**如下 JSON，不要添加任何额外文字或 Markdown 代码块。字段含义与 Scenario 接口一致（无需 id、tier、createdAt 字段）：

{
  "method": "${method}",
  "source": "AI 生成",
  "title": "简短标题（10字以内）",
  "scenarioText": "第一阶段展示给学员的情境描述（不含问题，200–400字）",
  "questions": [
    "问题1",
    "问题2"
  ],
  "referenceAnswer": {
    "frameworkUsed": "所用框架名称（如 JTBD、Kano 模型）",
    "sections": [
      {
        "title": "章节标题",
        "content": "该章节的示范内容",
        "whyThisMatters": "为什么这一点很重要"
      }
    ],
    "whatGoodLooksLike": "一段话：优秀作答的整体画像",
    "commonMistakes": [
      "常见错误1",
      "常见错误2"
    ],
    "furtherReading": [
      {
        "title": "推荐阅读标题",
        "author": "作者",
        "url": "可选链接"
      }
    ]
  },
  "difficulty": "${difficulty}",
  "tags": ["标签1", "标签2"]
}`
}
