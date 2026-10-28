<template>
  <div
    v-if="!userStore.getUser"
    class="mx-auto mt-10 w-[1200px] max-w-full px-4 pb-12"
  >
    <div class="rounded-2xl border border-zinc-200/80 bg-white px-6 py-16 text-center">
      <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
        <el-icon :size="24"><ChatDotRound /></el-icon>
      </div>
      <h1 class="mt-4 text-xl font-semibold text-zinc-950">登录后使用 AI 助手</h1>
      <p class="mt-2 text-sm leading-6 text-zinc-500">
        每个账号的对话独立保存，选择考研、四级、六级、语法或自由提问开始。
      </p>
      <button type="button" class="btn-ink mt-6 h-10 px-6 text-sm" @click="handleLogin">
        登录
      </button>
    </div>
  </div>

  <div
    v-else
    class="mx-auto mt-5 flex w-[1240px] max-w-full gap-4 px-4 pb-6"
  >
    <aside class="hidden h-[calc(100vh-7.5rem)] w-[280px] shrink-0 lg:block">
      <Conversations
        :sessions="sessions"
        :active-session-id="activeSessionId"
        :active-assistant="activeAssistant"
        @new-chat="newChat"
        @select-session="selectSession"
        @rename-session="renameSession"
        @delete-session="deleteSession"
      />
    </aside>

    <div class="min-w-0 flex-1">
      <div class="mb-2 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-600"
          @click="mobileOpen = true"
        >
          <el-icon :size="15"><Menu /></el-icon>
          对话记录
        </button>
        <span class="text-xs text-zinc-400">{{ activeAssistantPreset.name }}</span>
      </div>

      <Bubble
        :messages="messages"
        :assistant="activeAssistantPreset"
        :streaming="streaming"
        v-model:deep-think="deepThink"
        v-model:web-search="webSearch"
        @send="sendMessage"
        @stop="stopStream"
      />
    </div>

    <el-drawer
      v-model="mobileOpen"
      direction="ltr"
      size="88%"
      :with-header="false"
      class="chat-drawer"
    >
      <Conversations
        :sessions="sessions"
        :active-session-id="activeSessionId"
        :active-assistant="activeAssistant"
        @new-chat="newChat"
        @select-session="selectSession"
        @rename-session="renameSession"
        @delete-session="deleteSession"
      />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Menu } from '@element-plus/icons-vue'
import {
  getAssistantPreset,
  type AssistantId,
  type ChatSession,
  type CoachMessage,
  type CoachStreamEvent,
} from '@en/common/chat'
import { useUserStore } from '@/stores/user'
import { useLogin } from '@/hooks/useLogin'
import {
  getChatMessages,
  getChatSessions,
  removeChatSession,
  renameChatSession,
  streamCoach,
} from '@/apis/coach'
import Conversations from './components/Conversations.vue'
import Bubble from './components/Bubble.vue'

const userStore = useUserStore()
const { login } = useLogin()

const sessions = ref<ChatSession[]>([])
const activeSessionId = ref<string | null>(null)
const activeAssistant = ref<AssistantId>('general')
const messages = ref<CoachMessage[]>([])
const streaming = ref(false)
const deepThink = ref(false)
const webSearch = ref(false)
const mobileOpen = ref(false)
let controller: AbortController | null = null

const activeAssistantPreset = computed(() => getAssistantPreset(activeAssistant.value))

const handleLogin = async () => {
  const ok = await login()
  if (ok) await loadSessions(true)
}

const loadSessions = async (selectFirst = false) => {
  if (!userStore.getUser) return
  try {
    const res = await getChatSessions()
    sessions.value = res.data
    if (selectFirst && !activeSessionId.value && sessions.value[0]) {
      await selectSession(sessions.value[0].id)
    }
  } catch {
    ElMessage.error('对话列表加载失败')
  }
}

const newChat = (assistantId: AssistantId) => {
  stopStream()
  activeSessionId.value = null
  activeAssistant.value = assistantId
  messages.value = []
  mobileOpen.value = false
  if (assistantId !== 'general') {
    deepThink.value = false
    webSearch.value = false
  }
}

const selectSession = async (sessionId: string) => {
  if (activeSessionId.value === sessionId && messages.value.length) {
    mobileOpen.value = false
    return
  }
  stopStream()
  activeSessionId.value = sessionId
  const session = sessions.value.find((item) => item.id === sessionId)
  if (session) activeAssistant.value = session.assistantId
  deepThink.value = false
  webSearch.value = false
  messages.value = []
  mobileOpen.value = false
  try {
    const res = await getChatMessages(sessionId)
    messages.value = res.data
  } catch {
    ElMessage.error('对话记录加载失败')
    activeSessionId.value = null
  }
}

const stopStream = () => {
  if (controller) {
    controller.abort()
    controller = null
  }
  streaming.value = false
  const last = messages.value.at(-1)
  if (last?.role === 'ai') last.streaming = false
}

const appendEvent = (event: CoachStreamEvent) => {
  if (event.type === 'meta') {
    activeSessionId.value = event.sessionId
    activeAssistant.value = event.assistantId
    if (!sessions.value.some((item) => item.id === event.sessionId)) {
      const now = new Date().toISOString()
      sessions.value.unshift({
        id: event.sessionId,
        title: event.title,
        assistantId: event.assistantId,
        lastMessage: null,
        lastMessageAt: now,
        messageCount: 1,
        createdAt: now,
        updatedAt: now,
      })
    }
    return
  }

  if (event.type === 'done') {
    const last = messages.value.at(-1)
    if (last?.role === 'ai') last.streaming = false
    streaming.value = false
    void loadSessions()
    return
  }

  if (event.type === 'error') {
    const last = messages.value.at(-1)
    if (last?.role === 'ai') {
      last.streaming = false
      last.content ||= `抱歉，${event.message}`
    }
    streaming.value = false
    ElMessage.error(event.message)
    return
  }

  const last = messages.value.at(-1)
  if (!last || last.role !== 'ai') return

  if (event.type === 'reasoning') {
    last.reasoning = `${last.reasoning || ''}${event.content}`
  } else if (event.type === 'content') {
    last.content += event.content
  } else if (event.type === 'citation') {
    const citations = last.citations ?? []
    if (!citations.some((item) => item.chunkId === event.citation.chunkId)) {
      citations.push(event.citation)
    }
    last.citations = citations.sort((a, b) => a.index - b.index)
  } else if (event.type === 'tool_call' || event.type === 'tool_result') {
    const tools = last.tools ?? []
    const index = tools.findIndex((item) => item.id === event.tool.id)
    if (index === -1) tools.push(event.tool)
    else tools[index] = event.tool
    last.tools = tools
  }
}

const sendMessage = async (content: string) => {
  if (!content.trim() || streaming.value) return
  const ok = await login()
  if (!ok) return

  const now = Date.now()
  messages.value.push({ id: `human-${now}`, role: 'human', content })
  messages.value.push({
    id: `ai-${now}`,
    role: 'ai',
    content: '',
    reasoning: '',
    citations: [],
    tools: [],
    streaming: true,
  })
  streaming.value = true
  controller = new AbortController()

  try {
    await streamCoach(
      {
        sessionId: activeSessionId.value || undefined,
        assistantId: activeAssistant.value,
        content,
        deepThink: activeAssistant.value === 'general' && deepThink.value,
        webSearch: activeAssistant.value === 'general' && webSearch.value,
      },
      appendEvent,
      controller.signal,
    )
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      const last = messages.value.at(-1)
      if (last?.role === 'ai') last.streaming = false
      streaming.value = false
      return
    }
    const last = messages.value.at(-1)
    if (last?.role === 'ai') {
      last.streaming = false
      last.content ||= 'AI 服务暂时不可用，请稍后再试。'
    }
    streaming.value = false
    ElMessage.error(error instanceof Error ? error.message : 'AI 服务暂时不可用')
  } finally {
    if (!streaming.value) controller = null
  }
}

const renameSession = async (session: ChatSession) => {
  try {
    const result = await ElMessageBox.prompt('输入新的对话标题', '重命名对话', {
      inputValue: session.title,
      inputPattern: /\S+/,
      inputErrorMessage: '标题不能为空',
      confirmButtonText: '保存',
      cancelButtonText: '取消',
    })
    const res = await renameChatSession(session.id, result.value.trim())
    if (res.data) {
      session.title = res.data.title
      ElMessage.success('已重命名')
    }
  } catch {
    // cancelled or failed
  }
}

const deleteSession = async (session: ChatSession) => {
  try {
    await ElMessageBox.confirm(`删除「${session.title}」后无法恢复，确定继续？`, '删除对话', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await removeChatSession(session.id)
    sessions.value = sessions.value.filter((item) => item.id !== session.id)
    if (activeSessionId.value === session.id) newChat(activeAssistant.value)
    ElMessage.success('已删除')
  } catch {
    // cancelled or failed
  }
}

onMounted(() => {
  void loadSessions(true)
})

watch(
  () => userStore.getUser,
  (user) => {
    if (user) void loadSessions(true)
    else {
      sessions.value = []
      messages.value = []
      activeSessionId.value = null
    }
  },
)
</script>

<style scoped>
:deep(.chat-drawer .el-drawer__body) {
  padding: 0;
}
</style>
