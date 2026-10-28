<template>
  <div class="w-full">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2 text-xs text-zinc-400">
        <span>{{ startLabel }}</span>
        <span class="h-px w-4 bg-zinc-200" />
        <span>{{ endLabel }}</span>
      </div>
      <div v-if="!compact" class="flex items-center gap-2 text-[11px] text-zinc-400">
        <span>少</span>
        <span class="h-3 w-3 rounded-[3px] bg-zinc-100" />
        <span class="h-3 w-3 rounded-[3px] bg-teal-100" />
        <span class="h-3 w-3 rounded-[3px] bg-teal-300" />
        <span class="h-3 w-3 rounded-[3px] bg-teal-500" />
        <span class="h-3 w-3 rounded-[3px] bg-teal-700" />
        <span>多</span>
      </div>
    </div>

    <div class="mt-4 overflow-x-auto pb-1">
      <div
        class="grid w-max grid-flow-col"
        :class="compact ? 'gap-[3px]' : 'gap-1'"
        :style="gridStyle"
      >
        <span
          v-for="day in days"
          :key="day.date"
          class="block rounded-[3px] transition-colors"
          :class="cellClass(day)"
          :style="cellStyle"
          :title="tooltip(day)"
        />
      </div>
    </div>

    <div v-if="!compact" class="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
      <span>共 {{ totalCount }} 次练习 · 活跃 {{ activeDays }} 天</span>
      <span>{{ totalMinutes }} 分钟</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HeatmapDay } from '@en/common/stats'

const props = withDefaults(defineProps<{
  days: HeatmapDay[]
  startDate?: string
  endDate?: string
  maxCount?: number
  activeDays?: number
  totalCount?: number
  totalMinutes?: number
  compact?: boolean
}>(), {
  startDate: '',
  endDate: '',
  maxCount: 0,
  activeDays: 0,
  totalCount: 0,
  totalMinutes: 0,
  compact: false,
})

const startLabel = computed(() => props.startDate.slice(5).replace('-', '/'))
const endLabel = computed(() => props.endDate.slice(5).replace('-', '/'))
const cellSize = computed(() => (props.compact ? '10px' : '13px'))
const cellStyle = computed(() => ({
  width: cellSize.value,
  height: cellSize.value,
}))
const gridStyle = computed(() => ({
  gridTemplateRows: `repeat(7, ${cellSize.value})`,
  gridAutoFlow: 'column',
}))

const cellClass = (day: HeatmapDay) => {
  if (day.future) return 'bg-transparent'
  if (day.count <= 0) return 'bg-zinc-100'
  const max = Math.max(props.maxCount, 1)
  const ratio = day.count / max
  if (ratio <= 0.25) return 'bg-teal-100'
  if (ratio <= 0.5) return 'bg-teal-300'
  if (ratio <= 0.75) return 'bg-teal-500'
  return 'bg-teal-700'
}

const tooltip = (day: HeatmapDay) => {
  if (day.future) return day.date
  return `${day.date} · ${day.count} 次练习 · ${day.minutes} 分钟`
}
</script>
