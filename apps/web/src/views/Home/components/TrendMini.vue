<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-700">Activity</p>
        <p class="mt-1 text-sm text-zinc-500">近 {{ points.length }} 天练习趋势</p>
      </div>
      <div class="flex items-center gap-4 text-xs text-zinc-400">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-teal-300" />
          新学
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-teal-700" />
          复习
        </span>
        <span class="tabular-nums">正确率 {{ accuracy }}%</span>
      </div>
    </div>

    <div
      v-if="totalAttempts === 0"
      class="mt-4 flex h-24 items-center justify-center rounded-xl bg-[#fbfaf7] text-xs text-zinc-400"
    >
      还没有练习记录，完成一组学习后这里会出现趋势。
    </div>

    <template v-else>
      <div class="mt-4 flex h-24 items-end gap-[3px]">
        <div
          v-for="point in points"
          :key="point.date"
          class="group relative flex h-full flex-1 items-end"
          :title="`${point.date} · 新学 ${point.learned} · 复习 ${point.reviewed} · 正确率 ${point.accuracy}%`"
        >
          <div
            class="flex w-full flex-col justify-end overflow-hidden rounded-t-[3px] bg-zinc-100/80 transition-all group-hover:bg-zinc-200/80"
            :style="{ height: barHeight(point) }"
          >
            <div
              v-if="point.learned > 0"
              class="w-full bg-teal-300"
              :style="{ height: segmentHeight(point.learned, point.total) }"
            />
            <div
              v-if="point.reviewed > 0"
              class="w-full bg-teal-700"
              :style="{ height: segmentHeight(point.reviewed, point.total) }"
            />
          </div>
        </div>
      </div>

      <div class="mt-2 flex gap-[3px] text-[10px] tabular-nums text-zinc-400">
        <span
          v-for="(point, index) in points"
          :key="`label-${point.date}`"
          class="flex-1 text-center"
        >
          {{ index % 5 === 0 ? point.date.slice(5).replace('-', '/') : '' }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TrendPoint } from '@en/common/stats'

const props = defineProps<{
  points: TrendPoint[]
}>()

const maxTotal = computed(() => Math.max(1, ...props.points.map(item => item.total)))
const totalAttempts = computed(() => props.points.reduce((sum, item) => sum + item.total, 0))
const accuracy = computed(() => {
  if (totalAttempts.value === 0) return 0
  const correct = props.points.reduce((sum, item) => sum + item.correct, 0)
  return Math.round((correct / totalAttempts.value) * 100)
})

const barHeight = (point: TrendPoint) => {
  if (point.total <= 0) return '2px'
  return `${Math.max(4, Math.round((point.total / maxTotal.value) * 100))}%`
}

const segmentHeight = (value: number, total: number) =>
  `${Math.max(4, Math.round((value / Math.max(total, 1)) * 100))}%`
</script>
