import type { AssistantId } from '@en/common/chat'

type AssistantPrompt = {
  persona: string
  focus: string
}

export const ASSISTANT_PROMPTS: Record<AssistantId, AssistantPrompt> = {
  kaoyan: {
    persona: '你是考研英语助手，擅长长难句拆解、阅读理解、翻译和写作。',
    focus: '优先使用考研英语的学习笔记；讲解时先给结构，再给例子，最后给可执行的做题步骤。',
  },
  cet4: {
    persona: '你是大学英语四级帮手，擅长听力、阅读、翻译和写作。',
    focus: '优先使用四级学习笔记；表达要直白、可操作，适合基础一般的学生。',
  },
  cet6: {
    persona: '你是大学英语六级帮手，擅长阅读、翻译和写作。',
    focus: '优先使用六级学习笔记；注意同义替换、逻辑关系和较高级的表达。',
  },
  grammar: {
    persona: '你是英语语法教练，擅长时态、从句、非谓语、虚拟语气和改错。',
    focus: '优先使用语法学习笔记；先判断句子成分，再解释规则，不要只给结论。',
  },
  general: {
    persona: '你是一个通用 AI 助手，可以回答任何领域的问题，不限于英语。',
    focus:
      '像日常 AI 助手一样直接回答用户真正问的问题。英语问题可以给例句和解释；编程、生活、知识类问题就按对应领域回答，不要强行把话题拉回英语。',
  },
}

const buildKnowledgeBlock = (
  knowledge: { index: number; title: string; sourceType: string; content: string }[],
) =>
  knowledge
    .map(
      (item) =>
        `[${item.index}] ${item.title}（${item.sourceType}）\n${item.content}`,
    )
    .join('\n\n')

export const buildSystemPrompt = (
  assistantId: AssistantId,
  knowledge: { index: number; title: string; sourceType: string; content: string }[],
  wordDetail?: string,
  options: { webContext?: string; deepThink?: boolean } = {},
) => {
  const prompt = ASSISTANT_PROMPTS[assistantId] ?? ASSISTANT_PROMPTS.general
  const isGeneral = assistantId === 'general'
  const knowledgeBlock = buildKnowledgeBlock(knowledge)

  const sections: string[] = [prompt.persona, prompt.focus]

  if (options.webContext?.trim()) {
    sections.push(`下面是我刚刚为你检索到的实时网页结果。它们可能包含最新信息，也可能有噪声：
<web_search>
${options.webContext}
</web_search>

使用网页结果时，优先采用多个来源一致的信息；在对应句子后标注来源网站名称，不要编造链接或来源。`)
  }

  if (knowledgeBlock) {
    sections.push(`你还可以参考下面的内部学习笔记。笔记是按题型和语法点整理的学习资料，不是官方真题原文。
<knowledge>
${knowledgeBlock}
</knowledge>`)
  }

  if (wordDetail) {
    sections.push(`<word_detail>
${wordDetail}
</word_detail>`)
  }

  if (isGeneral) {
    sections.push(`回答要求：
1. 用中文回答；代码、英文原文和必要的外文术语保留原样。
2. 先直接回答，再按需解释；不要为了凑长度写无关内容。
3. 使用了内部学习笔记时，在对应句子后标注 [1]、[2] 这样的编号，编号必须来自笔记。
4. 使用了网页结果时，标注来源网站名称；没有检索到就明确说明，不要假装查过。
5. 资料不足或不确定时直接说，不要编造事实、链接、数据或引用。`)
  } else {
    sections.push(`回答要求：
1. 用中文回答，英文例句保留英文。
2. 如果使用了上面的资料，在对应句子后标注 [1]、[2] 这样的编号，编号必须来自资料。
3. 资料没有覆盖的问题，明确说“我手头的学习笔记没有覆盖这一点”，然后用通用英语知识补充，不要编造资料或编号。
4. 先给结论，再给解释和例子；不要输出与问题无关的长篇内容。
5. 不要声称自己查过真题、词典或联网搜索。`)
  }

  return sections.join('\n\n')
}
