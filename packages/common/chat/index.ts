export type ChatRole = 'human' | 'ai'; // 角色 human: 用户 ai: 助手

// F3 多助手
export type AssistantId = 'kaoyan' | 'cet4' | 'cet6' | 'grammar' | 'general';

export type AssistantPreset = {
  id: AssistantId;
  name: string;
  shortName: string;
  description: string;
  welcome: string;
  suggestions: string[];
}

export const CHAT_ASSISTANTS: AssistantPreset[] = [
  {
    id: 'kaoyan',
    name: '考研助手',
    shortName: '考研',
    description: '长难句、阅读、翻译与写作',
    welcome: '我是考研英语助手。可以帮你拆长难句、分析阅读题型、打磨翻译和作文。',
    suggestions: ['帮我拆一个长难句', '阅读主旨题怎么做', '给我一个作文开头模板'],
  },
  {
    id: 'cet4',
    name: '四级帮手',
    shortName: '四级',
    description: '四级听力、阅读、翻译与写作',
    welcome: '我是四级帮手。听力场景、阅读定位、翻译表达和写作模板都可以问我。',
    suggestions: ['四级听力怎么抓关键词', '翻译遇到不会的词怎么办', '给我一个写作模板'],
  },
  {
    id: 'cet6',
    name: '六级帮手',
    shortName: '六级',
    description: '六级阅读、翻译与写作',
    welcome: '我是六级帮手。可以帮你处理六级阅读、翻译和写作里的难点。',
    suggestions: ['六级阅读怎么提速', '六级翻译常见搭配', '作文如何写得更高级'],
  },
  {
    id: 'grammar',
    name: '语法教练',
    shortName: '语法',
    description: '时态、从句、非谓语与改错',
    welcome: '我是语法教练。把你不确定的句子发给我，我们从结构开始拆。',
    suggestions: ['定语从句和同位语怎么区分', '非谓语动词怎么选', '帮我改一个病句'],
  },
  {
    id: 'general',
    name: '自由提问',
    shortName: '自由',
    description: '任何领域都可以问，不限于英语',
    welcome: '有什么想聊的都可以问我，不限于英语。',
    suggestions: ['帮我解释一个概念', '写一段 Python 示例', '今天适合做什么'],
  },
]

export const getAssistantPreset = (id: string): AssistantPreset =>
  CHAT_ASSISTANTS.find((item) => item.id === id) ?? CHAT_ASSISTANTS[4]!

// F3 会话
export type ChatSession = {
  id: string;
  title: string;
  assistantId: AssistantId;
  lastMessage: string | null;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ChatSessionList = ChatSession[]

export type ChatCitation = {
  index: number;
  chunkId: string;
  title: string;
  examType: string;
  sourceType: string;
  excerpt: string;
}

export type ChatToolStatus = 'running' | 'done' | 'error';

export type ChatToolCall = {
  id: string;
  name: 'searchKnowledge' | 'getWordDetail' | 'webSearch';
  args: Record<string, unknown>;
  status: ChatToolStatus;
  summary?: string;
}

// 新版消息（前端展示 + 历史记录）
export type CoachMessage = {
  id?: string;
  role: ChatRole;
  content: string;
  reasoning?: string;
  citations?: ChatCitation[];
  tools?: ChatToolCall[];
  streaming?: boolean;
}

export type CoachDto = {
  sessionId?: string;
  assistantId: AssistantId;
  content: string;
  deepThink?: boolean;
  webSearch?: boolean;
}

export type CoachStreamEvent =
  | { type: 'meta'; sessionId: string; title: string; assistantId: AssistantId }
  | { type: 'reasoning'; content: string }
  | { type: 'content'; content: string }
  | { type: 'tool_call'; tool: ChatToolCall }
  | { type: 'tool_result'; tool: ChatToolCall }
  | { type: 'citation'; citation: ChatCitation }
  | { type: 'done'; sessionId: string; title: string }
  | { type: 'error'; message: string }
