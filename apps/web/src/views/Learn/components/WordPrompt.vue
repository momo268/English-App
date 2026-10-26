<template>
  <div class="w-full py-2 text-center">
    <!-- 单词：默认隐藏；默认模式/悬停/答对/显示答案时出现 -->
    <div class="mb-4 flex min-h-20 items-center justify-center">
      <div
        v-if="wordVisible"
        class="break-words text-4xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-6xl dark:text-white"
      >
        {{ word.word }}
      </div>
      <span v-else class="text-sm tracking-widest text-zinc-400 dark:text-zinc-500">听音拼写</span>
    </div>

    <!-- 音标 + 发音 -->
    <div class="flex items-center justify-center gap-3">
      <button
        type="button"
        class="group flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition hover:bg-teal-100 dark:bg-teal-400/10 dark:text-teal-300 dark:hover:bg-teal-400/20"
        title="播放发音"
        :aria-label="`播放${accent === 'uk' ? '英音' : '美音'}`"
        :aria-busy="loading"
        :class="{ 'ring-2 ring-teal-300/70': playing }"
        @click="$emit('speak')"
      >
        <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600 motion-reduce:animate-none" />
        <SpeakerIcon v-else :playing="playing" class="h-5 w-5 transition group-hover:scale-110" />
      </button>
      <span class="text-[10px] font-semibold tracking-wide text-zinc-400">{{ accent === 'uk' ? 'UK' : 'US' }}</span>
      <span
        v-if="word.phonetic"
        class="font-mono text-base text-zinc-400 dark:text-zinc-500"
      >
        {{ word.phonetic }}
      </span>
    </div>
    <p v-if="audioError" role="status" class="mt-3 text-xs text-amber-600 dark:text-amber-400">{{ audioError }}</p>

    <!-- 一行中文释义 -->
    <p
      class="mx-auto mt-7 max-w-2xl text-base font-normal leading-8 text-zinc-600 sm:text-lg dark:text-zinc-300"
    >
      {{ meaning }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SpeakerIcon from './SpeakerIcon.vue'
import type { LearnStatus, LearnWord } from '@en/common/learn'
import { formatTranslation } from '../utils'

const props = defineProps<{
  word: LearnWord
  revealed: boolean
  peeked: boolean
  showWord: boolean
  status: LearnStatus
  accent: 'us' | 'uk'
  playing: boolean
  loading: boolean
  audioError: string
}>()

defineEmits<{
  speak: []
}>()

const wordVisible = computed(
  () => props.showWord || props.peeked || props.revealed || props.status === 'correct',
)

const meaning = computed(() => formatTranslation(props.word.translation))
</script>
