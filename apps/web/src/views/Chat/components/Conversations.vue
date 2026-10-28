<template>
  <aside class="flex h-full min-h-0 flex-col rounded-2xl border border-zinc-200/80 bg-white">
    <div class="p-3 pb-2">
      <button
        type="button"
        class="btn-ink flex h-10 w-full items-center justify-center gap-2 text-sm"
        @click="emits('newChat', activeAssistant)"
      >
        <el-icon :size="16"><Plus /></el-icon>
        新对话
      </button>
    </div>

    <div class="px-3 pb-2 pt-2">
      <p class="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        AI 助手
      </p>
      <div class="space-y-0.5">
        <button
          v-for="assistant in CHAT_ASSISTANTS"
          :key="assistant.id"
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
          :class="
            activeAssistant === assistant.id
              ? 'bg-teal-50 text-teal-900'
              : 'text-zinc-600 hover:bg-[#f7f6f1] hover:text-zinc-950'
          "
          @click="emits('newChat', assistant.id)"
        >
          <span
            class="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[11px] font-semibold"
            :class="
              activeAssistant === assistant.id
                ? 'bg-teal-700 text-white'
                : 'bg-[#f7f6f1] text-zinc-500'
            "
          >
            {{ assistant.shortName.slice(0, 1) }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-medium">{{ assistant.name }}</span>
            <span class="block truncate text-[11px] text-zinc-400">{{ assistant.description }}</span>
          </span>
        </button>
      </div>
    </div>

    <div class="mx-3 border-t border-zinc-100" />

    <div class="flex min-h-0 flex-1 flex-col px-3 pt-3">
      <div class="flex items-center justify-between px-1 pb-2">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">历史对话</p>
        <span class="text-[11px] text-zinc-400">{{ sessions.length }}</span>
      </div>
      <p v-if="!sessions.length" class="px-1 py-4 text-xs leading-5 text-zinc-400">
        还没有对话，选择一个助手开始吧。
      </p>
      <div v-else class="-mx-1 flex-1 space-y-0.5 overflow-y-auto px-1 pb-2">
        <div
          v-for="session in sessions"
          :key="session.id"
          role="button"
          tabindex="0"
          class="group flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors"
          :class="
            activeSessionId === session.id
              ? 'bg-[#f7f6f1] text-zinc-950'
              : 'text-zinc-600 hover:bg-[#fbfaf7] hover:text-zinc-950'
          "
          @click="emits('selectSession', session.id)"
          @keydown.enter="emits('selectSession', session.id)"
        >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-medium">{{ session.title }}</span>
            <span class="mt-0.5 block truncate text-[11px] text-zinc-400">
              {{ assistantName(session.assistantId) }} · {{ formatTime(session.lastMessageAt) }}
            </span>
          </span>
          <span class="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              class="grid h-6 w-6 place-items-center rounded text-zinc-400 hover:bg-white hover:text-zinc-700"
              title="重命名"
              @click.stop="emits('renameSession', session)"
            >
              <el-icon :size="13"><Edit /></el-icon>
            </button>
            <button
              type="button"
              class="grid h-6 w-6 place-items-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-500"
              title="删除"
              @click.stop="emits('deleteSession', session)"
            >
              <el-icon :size="13"><Delete /></el-icon>
            </button>
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import {
  CHAT_ASSISTANTS,
  getAssistantPreset,
  type AssistantId,
  type ChatSession,
} from '@en/common/chat'

withDefaults(
  defineProps<{
    sessions?: ChatSession[]
    activeSessionId?: string | null
    activeAssistant?: AssistantId
  }>(),
  {
    sessions: () => [],
    activeSessionId: null,
    activeAssistant: 'general',
  },
)

const emits = defineEmits<{
  newChat: [assistantId: AssistantId]
  selectSession: [sessionId: string]
  renameSession: [session: ChatSession]
  deleteSession: [session: ChatSession]
}>()

const assistantName = (id: AssistantId) => getAssistantPreset(id).name

const formatTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const now = Date.now()
  const diff = now - date.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>
