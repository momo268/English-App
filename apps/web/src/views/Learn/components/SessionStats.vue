<template>
  <div
    class="rounded-2xl border border-zinc-200/80 bg-white/60 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]"
  >
    <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <div
        v-for="item in items"
        :key="item.label"
        class="px-2 py-1 text-center"
      >
        <div class="text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
          {{ item.value }}
        </div>
        <div class="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatTime } from '../utils'

const props = defineProps<{
  elapsed: number
  inputCount: number
  wpm: number
  correctInput: number
  accuracy: number
}>()

const items = computed(() => [
  { label: '时间', value: formatTime(props.elapsed) },
  { label: '输入数', value: props.inputCount },
  { label: 'WPM', value: props.wpm },
  { label: '正确数', value: props.correctInput },
  { label: '正确率', value: `${props.accuracy}%` },
])
</script>
