import { MethodId } from '@/types'

export interface RubricDimension {
  name: string        // 维度名称（中文）
  description: string // 5分标准：达到此描述才算满分
}

export const RUBRICS: Record<MethodId, RubricDimension[]> = {
  'requirement-translation': [
    {
      name: '用户情境具体性',
      description:
        '描述了具体的用户细分群体和使用场景，而非泛泛的"用户"',
    },
    {
      name: '问题与方案分离',
      description:
        '将功能需求重新定义为用户问题，而非直接讨论解决方案',
    },
    {
      name: '后果描述',
      description:
        '清晰描述了如果问题不解决，用户会有什么损失',
    },
    {
      name: '假设识别',
      description:
        '明确指出了哪些是已知事实，哪些是假设',
    },
  ],

  'product-teardown': [
    {
      name: '五维度覆盖',
      description:
        '覆盖了引导流程、首次体验、决策节点、摩擦点、惊喜细节全部五个维度',
    },
    {
      name: '观察具体性',
      description:
        '所有观察都有具体的界面元素或流程支撑，而非笼统印象',
    },
    {
      name: '跨行业洞察',
      description:
        '至少引用了一个来自不同行业的对比或启发',
    },
    {
      name: '设计意图推断',
      description:
        '推断了设计决策背后的业务逻辑，而非只描述现象',
    },
  ],

  'roadmap-decisions': [
    {
      name: '机会成本说明',
      description:
        '清晰说明了不做此事，团队可以获得什么（时间、精力、聚焦）',
    },
    {
      name: '战略对齐推理',
      description:
        '将"不做"与公司战略或阶段目标挂钩，而非仅凭直觉',
    },
    {
      name: '干系人沟通框架',
      description:
        '考虑了如何向提需求方解释这个决策',
    },
    {
      name: '重新考虑条件',
      description:
        '说明了在什么情况下可能会重新审视这个决定',
    },
  ],

  'judgment-review': [
    {
      name: '决策清晰度',
      description:
        '决策被明确陈述（是/否，做/不做），没有模棱两可',
    },
    {
      name: '假设显式化',
      description:
        '假设和已知事实被分开列出，而非混在一起',
    },
    {
      name: '复盘诚实度',
      description:
        '真实分析了什么判断是错的，而非只总结成功经验',
    },
    {
      name: '学习提取',
      description:
        '提炼出了具体可操作的改进点，而非笼统的"要更谨慎"',
    },
  ],

  'raw-user-data': [
    {
      name: '信号与噪声分离',
      description:
        '区分了个别情况和系统性模式，没有被单个极端反馈带偏',
    },
    {
      name: '根因深度',
      description:
        '分析至少深入到两层（表面症状→中间原因→根本原因）',
    },
    {
      name: '量化验证意识',
      description:
        '提出了如何验证这个问题的规模（多少用户受影响）',
    },
    {
      name: '行动框架',
      description:
        '将解读结果落地为"应该去调研/验证什么"而非直接给出解决方案',
    },
  ],

  'learning-process': [
    {
      name: '问题质量提取',
      description:
        '识别出了专家问的关键问题，而非只关注他们的结论',
    },
    {
      name: '问题定义分析',
      description:
        '分析了专家如何界定问题边界（包括了什么，排除了什么）',
    },
    {
      name: '可迁移原则',
      description:
        '提炼出了至少一个可应用到自己工作中的思维原则',
    },
    {
      name: '与自身方法对比',
      description:
        '明确对比了专家的方法和自己通常的处理方式有何不同',
    },
  ],
}
