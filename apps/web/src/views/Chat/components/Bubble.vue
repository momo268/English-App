<template>
  <section
    class="flex h-[calc(100dvh-10.25rem)] min-h-[520px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white lg:h-[calc(100dvh-7.5rem)] lg:min-h-[620px]"
  >
    <header class="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-6">
      <div class="min-w-0">
        <h1 class="truncate text-sm font-semibold text-zinc-950">{{ assistant.name }}</h1>
        <p class="truncate text-xs text-zinc-400">{{ assistant.description }}</p>
      </div>
      <span class="shrink-0 text-[11px] text-zinc-400">AI 助手</span>
    </header>

    <div ref="scrollRef" class="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div
        v-if="!messages.length"
        class="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-10 text-center"
      >
        <p class="text-[11px] font-semibold tracking-[0.24em] text-teal-700 uppercase">AI Assistant</p>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{{ assistant.name }}</h2>
        <p class="mt-3 max-w-md text-sm leading-7 text-zinc-500">{{ assistant.welcome }}</p>
        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <button
            v-for="suggestion in assistant.suggestions"
            :key="suggestion"
            type="button"
            class="rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            @click="useSuggestion(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <div v-else class="mx-auto w-full max-w-3xl space-y-8 pb-2">
        <div v-for="(item, index) in messages" :key="item.id || index">
          <div v-if="item.role === 'human'" class="flex justify-end">
            <div
              class="max-w-[86%] rounded-3xl bg-[#f4f4f5] px-4 py-3 text-[15px] leading-7 whitespace-pre-wrap text-zinc-900"
            >
              {{ item.content }}
            </div>
          </div>

          <div v-else class="min-w-0">
            <details
              v-if="item.reasoning"
              :open="Boolean(item.streaming && !item.content)"
              class="group mb-2"
            >
              <summary
                class="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 text-xs text-zinc-500 transition-colors hover:text-zinc-700 [&::-webkit-details-marker]:hidden"
              >
                <span class="text-teal-700">✦</span>
                {{ item.streaming && !item.content ? '正在深度思考…' : '已深度思考' }}
              </summary>
              <div class="mt-1.5 border-l-2 border-zinc-200 pl-3 text-[13px] leading-6 whitespace-pre-wrap text-zinc-500">
                {{ item.reasoning }}
              </div>
            </details>

            <div v-if="item.tools?.length" class="mb-2 flex flex-wrap gap-1.5">
              <div
                v-for="tool in item.tools"
                :key="tool.id"
                class="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[#f7f6f1] px-2.5 py-1.5 text-[11px] text-zinc-500"
              >
                <el-icon v-if="tool.status === 'running'" class="animate-spin text-teal-600" :size="12">
                  <Loading />
                </el-icon>
                <el-icon v-else-if="tool.status === 'error'" class="text-rose-500" :size="12">
                  <Warning />
                </el-icon>
                <el-icon v-else class="text-teal-600" :size="12"><CircleCheck /></el-icon>
                <span class="font-medium text-zinc-700">{{ toolLabel(tool.name) }}</span>
                <span class="truncate">{{ tool.summary || '处理中…' }}</span>
              </div>
            </div>

            <div
              v-if="item.content"
              class="deepseek-markdown text-[15px] text-zinc-800"
              v-html="parseMarkdown(item.content, item.citations?.length || 0, item.streaming)"
            />
            <div v-else-if="item.streaming" class="flex items-center gap-1.5 py-2 text-zinc-400">
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500 [animation-delay:120ms]" />
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500 [animation-delay:240ms]" />
            </div>

            <div v-if="item.citations?.length" class="mt-4 border-t border-zinc-100 pt-2">
              <p class="mb-1 px-1 text-[11px] text-zinc-400">参考来源 · {{ item.citations.length }} 条学习笔记</p>
              <div class="space-y-0.5">
                <details
                  v-for="citation in item.citations"
                  :key="citation.chunkId"
                  class="rounded-lg px-1.5 py-1.5 transition-colors hover:bg-zinc-50"
                >
                  <summary class="cursor-pointer text-xs font-medium text-zinc-600">
                    [{{ citation.index }}] {{ citation.title }}
                  </summary>
                  <p class="mt-1 text-[11px] leading-5 text-zinc-500">{{ citation.excerpt }}</p>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-zinc-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <div class="mx-auto max-w-3xl">
        <div
          class="rounded-[26px] border border-zinc-200 bg-white p-2.5 shadow-sm"
        >
          <textarea
            ref="inputRef"
            v-model="message"
            rows="2"
            :disabled="streaming"
            class="block max-h-40 min-h-[48px] w-full resize-none border-0 bg-transparent px-2 py-1 text-[15px] leading-7 text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60"
            placeholder="给 AI 发送消息"
            @input="resizeInput"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <div class="flex items-center justify-between gap-2 px-1 pt-1">
            <div class="flex min-w-0 items-center gap-1">
              <button
                v-if="assistant.id === 'general'"
                type="button"
                class="inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-colors disabled:opacity-50 sm:text-xs"
                :class="
                  deepThink
                    ? 'border-teal-200 bg-teal-50 text-teal-700'
                    : 'border-transparent text-zinc-500 hover:bg-zinc-100'
                "
                :disabled="streaming"
                @click="emits('update:deepThink', !deepThink)"
              >
                <el-icon :size="14"><MagicStick /></el-icon>
                深度思考
              </button>
              <button
                v-if="assistant.id === 'general'"
                type="button"
                class="inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-colors disabled:opacity-50 sm:text-xs"
                :class="
                  webSearch
                    ? 'border-teal-200 bg-teal-50 text-teal-700'
                    : 'border-transparent text-zinc-500 hover:bg-zinc-100'
                "
                :disabled="streaming"
                @click="emits('update:webSearch', !webSearch)"
              >
                <el-icon :size="14"><Connection /></el-icon>
                联网搜索
              </button>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
              <button
                v-if="isRecording"
                type="button"
                class="grid h-9 w-9 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                @click="stopRecording"
              >
                <el-icon :size="17"><VideoPause /></el-icon>
              </button>
              <button
                v-else
                type="button"
                class="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-40"
                :disabled="streaming"
                @click="startRecording"
              >
                <el-icon :size="17"><Mic /></el-icon>
              </button>
              <button
                v-if="streaming"
                type="button"
                class="grid h-9 w-9 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition-colors hover:bg-zinc-50"
                @click="emits('stop')"
              >
                <el-icon :size="15"><VideoPause /></el-icon>
              </button>
              <button
                v-else
                type="button"
                class="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="!message.trim()"
                @click="sendMessage"
              >
                <el-icon :size="17"><Position /></el-icon>
              </button>
            </div>
          </div>
        </div>
        <p class="mt-2 text-center text-[11px] text-zinc-400">内容由 AI 生成，请仔细甄别</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CircleCheck,
  Connection,
  Loading,
  MagicStick,
  Mic,
  Position,
  VideoPause,
  Warning,
} from '@element-plus/icons-vue'
import { marked } from 'marked'
import type { AssistantPreset, ChatToolCall, CoachMessage } from '@en/common/chat'
import { useVoiceToText } from '@/hooks/useVoiceToText'
import '@/assets/css/deep-seek.css'

const props = withDefaults(
  defineProps<{
    messages: CoachMessage[]
    assistant: AssistantPreset
    streaming: boolean
    deepThink?: boolean
    webSearch?: boolean
  }>(),
  {
    messages: () => [],
    streaming: false,
    deepThink: false,
    webSearch: false,
  },
)

const emits = defineEmits<{
  send: [content: string]
  stop: []
  'update:deepThink': [value: boolean]
  'update:webSearch': [value: boolean]
}>()

const message = ref('')
const scrollRef = useTemplateRef<HTMLDivElement>('scrollRef')
const inputRef = useTemplateRef<HTMLTextAreaElement>('inputRef')
const { isRecording, start, stop } = useVoiceToText({
  lang: 'zh-CN',
  continuous: true,
})

const toolLabel = (name: ChatToolCall['name']) =>
  name === 'searchKnowledge' ? '检索学习笔记' : name === 'getWordDetail' ? '查询词库' : '联网搜索'

const parseMarkdown = (content: string, citationCount = 0, streaming = false) => {
  if (!content) return ''
  // 历史消息暂不保存引用；去掉无来源可点的 [1] 标记，避免看起来像坏链。
  const display = citationCount === 0 && !streaming ? content.replace(/\[\d+\]/g, '') : content
  return marked.parse(display)
}

const scrollToBottom = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.value
      if (!el) return
      el.scrollTop = el.scrollHeight
    })
  })
}

const resizeInput = () => {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

const sendMessage = () => {
  const value = message.value.trim()
  if (!value || props.streaming) return
  emits('send', value)
  message.value = ''
  nextTick(resizeInput)
}

const useSuggestion = (value: string) => {
  message.value = value
  sendMessage()
}

const startRecording = () => {
  try {
    start((result) => {
      message.value = result
      nextTick(resizeInput)
    })
  } catch {
    ElMessage.warning('当前浏览器不支持语音转文字')
  }
}

const stopRecording = () => {
  stop()
  if (message.value.trim()) sendMessage()
}

watch(
  () => props.messages,
  () => scrollToBottom(),
  { deep: true, immediate: true },
)
</script>
