<template>
  <div class="mx-auto max-w-4xl">
    <div class="text-center">
      <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700 dark:text-teal-400">
        {{ reviewMode ? 'Review Complete' : 'Chapter Complete' }}
      </p>
      <h1 class="mt-2 text-2xl font-black text-zinc-900 sm:text-3xl dark:text-white">
        {{ reviewMode ? '复习完成' : '本章完成' }}
      </h1>
      <p class="mt-1 text-sm text-zinc-400">
        {{ title }} · {{ reviewMode ? `复习 ${total} 个单词` : `共 ${total} 个单词` }}
      </p>
    </div>

    <div class="mt-9 grid grid-cols-3 gap-4">
      <div
        v-for="ring in rings"
        :key="ring.label"
        class="flex flex-col items-center rounded-2xl border border-zinc-200/70 bg-white/70 px-3 py-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]"
      >
        <div class="flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24" :style="ring.style">
          <div class="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white sm:h-20 sm:w-20 dark:bg-zinc-950">
            <span class="text-lg font-black text-zinc-900 sm:text-xl dark:text-white">{{ ring.value }}</span>
          </div>
        </div>
        <span class="mt-2 text-[11px] font-medium text-zinc-400">{{ ring.label }}</span>
      </div>
    </div>

    <div
      v-if="wrongWords.length"
      class="mt-7 rounded-2xl border border-zinc-200/70 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-zinc-900 dark:text-white">
          {{ reviewMode ? '本轮错词' : '本章错词' }}（{{ wrongWords.length }}）
        </h2>
        <span class="text-[11px] text-zinc-400">点击发音，悬停看释义</span>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="item in wrongWords"
          :key="item.word"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
          :class="selectedWord === item.word
            ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-400/50 dark:bg-teal-400/10 dark:text-teal-300'
            : 'border-zinc-200 bg-white text-zinc-600 hover:border-teal-300 hover:text-teal-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'"
          :title="item.translation"
          @click="selectWord(item)"
        >
          {{ item.word }}
        </button>
      </div>
      <p v-if="selectedTranslation" class="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        {{ selectedTranslation }}
      </p>
    </div>

    <div
      class="mt-7 rounded-2xl border border-zinc-200 border-l-2 border-l-teal-700/70 bg-white/70 p-4 text-sm leading-6 text-zinc-600 dark:border-white/10 dark:border-l-teal-400/50 dark:bg-white/[0.03] dark:text-zinc-300"
    >
      {{ recommendation }}
    </div>

    <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <button
        v-if="wrongWords.length"
        type="button"
        class="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        @click="$emit('reviewWrong')"
      >
        复习错词（{{ wrongWords.length }}）
      </button>
      <button
        type="button"
        class="rounded-xl border border-zinc-200 bg-white/70 px-6 py-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
        @click="$emit('restart')"
      >
        {{ reviewMode ? '再复习一轮' : '重练本章' }}
      </button>
      <button
        type="button"
        class="rounded-xl border border-zinc-200 bg-white/70 px-6 py-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
        @click="$emit('nextChapter')"
      >
        {{ reviewMode ? (reviewHasMore ? '继续复习' : '返回课程') : '下一章' }}
      </button>
    </div>

    <p class="mt-6 text-center text-[11px] text-zinc-400">
      {{ reviewMode
        ? `本轮复习 ${total} 个单词 · 答错的词会更早回到复习队列`
        : `本组新增 ${learnedCount} 个单词 · 错词会保留在复习队列` }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  title: string
  accuracy: number
  elapsed: number
  wpm: number
  total: number
  learnedCount: number
  wrongWords: { word: string; translation: string }[]
  reviewMode?: boolean
  reviewHasMore?: boolean
}>()

const emit = defineEmits<{
  reviewWrong: []
  restart: []
  nextChapter: []
  playWord: [word: string]
}>()

const selectedWord = ref('')
const selectedTranslation = ref('')

const selectWord = (item: { word: string; translation: string }) => {
  selectedWord.value = item.word
  selectedTranslation.value = item.translation
  emit('playWord', item.word)
}

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds || 0))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

const ringStyle = (percent: number, color: string) => ({
  background: `conic-gradient(${color} ${Math.max(0, Math.min(100, percent)) * 3.6}deg, rgba(113,113,122,0.16) 0deg)`,
})

const rings = computed(() => [
  {
    label: '正确率',
    value: `${props.accuracy}%`,
    style: ringStyle(props.accuracy, '#0f766e'),
  },
  {
    label: '章节用时',
    value: formatTime(props.elapsed),
    style: ringStyle(100, '#4f8d86'),
  },
  {
    label: 'WPM',
    value: props.wpm,
    style: ringStyle(Math.min(100, props.wpm * 2), '#9fbdb8'),
  },
])

const recommendation = computed(() => {
  if (props.reviewMode) {
    if (!props.wrongWords.length) {
      return `本轮复习 ${props.total} 个单词全部正确，SRS 已按记忆强度安排下一次复习时间。`
    }
    if (props.accuracy >= 80) {
      return `正确率 ${props.accuracy}%，这 ${props.wrongWords.length} 个错词会更早回到复习队列，建议今天就再过一遍。`
    }
    return `正确率 ${props.accuracy}%，先复习这 ${props.wrongWords.length} 个错词，再继续下一轮。`
  }
  if (!props.wrongWords.length) {
    return '全部正确，状态很好！可以直接进入下一章，或者再练一遍巩固一下。'
  }
  if (props.accuracy >= 95) {
    return `正确率 ${props.accuracy}%，先复习这 ${props.wrongWords.length} 个错词，再进入下一章会更稳。`
  }
  if (props.accuracy >= 80) {
    return `正确率 ${props.accuracy}%，建议先复习错词，再重练本章；不用急着往下走。`
  }
  return `正确率 ${props.accuracy}%，建议重练本章，把错词逐个过一遍再进入下一章。`
})
</script>
