<template>
  <Transition name="learn-fade">
    <div
      v-if="paused"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      @keydown.tab.prevent
      class="fixed inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-md dark:bg-zinc-950/70"
      @click="$emit('resume')"
    >
      <div
        class="mx-4 w-full max-w-xs rounded-2xl border border-zinc-200/70 bg-white/95 px-8 py-8 text-center shadow-xl dark:border-white/10 dark:bg-zinc-900/95"
      >
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="5" y="3" width="3" height="14" rx="1"/><rect x="12" y="3" width="3" height="14" rx="1"/></svg>
        </div>
        <h2 id="pause-title" class="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">休息一下，进度已保留</h2>
        <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">按字母键、空格或 Enter 继续</p>
        <button
          type="button"
          ref="resumeButton"
          class="mt-6 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          @click.stop="$emit('resume')"
        >
          继续学习
        </button>
        <p class="mt-4 text-[11px] text-zinc-400">计时已停止，继续后恢复</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
const props = defineProps<{ paused: boolean }>()
const resumeButton = ref<HTMLButtonElement | null>(null)
watch(() => props.paused, async (paused) => {
  if (paused) { await nextTick(); resumeButton.value?.focus({ preventScroll: true }) }
})
defineEmits<{ resume: [] }>()
</script>
