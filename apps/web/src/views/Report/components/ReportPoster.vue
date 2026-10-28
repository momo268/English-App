<template>
  <div
    ref="posterEl"
    class="relative w-[700px] overflow-hidden bg-[#f7f6f1] p-9 text-[#18181b]"
    style="font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif"
  >
    <div class="pointer-events-none absolute -right-28 -top-36 h-80 w-80 rounded-full bg-[#0f766e]/10 blur-3xl" />

    <header class="relative flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="grid h-10 w-10 place-items-center rounded-xl bg-[#0f766e] text-sm font-bold text-white">
          E
        </div>
        <div>
          <p class="text-sm font-semibold tracking-tight text-[#18181b]">English App</p>
          <p class="text-[10px] uppercase tracking-[0.28em] text-[#71717a]">Weekly Report</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-[11px] uppercase tracking-[0.18em] text-[#a1a1aa]">{{ report.year }}</p>
        <p class="mt-1 text-sm font-medium text-[#52525b]">{{ report.label }}</p>
      </div>
    </header>

    <section class="relative mt-10">
      <p class="text-[11px] uppercase tracking-[0.28em] text-[#0f766e]">本周学习</p>
      <div class="mt-2 flex items-end gap-3">
        <span class="text-6xl font-semibold leading-none tracking-[-0.07em] text-[#18181b]">
          {{ report.summary.studyDays }}
        </span>
        <span class="pb-2 text-sm text-[#71717a]">天有学习记录</span>
      </div>
      <p class="mt-3 max-w-[480px] text-sm leading-6 text-[#52525b]">
        {{ report.comment }}
      </p>
    </section>

    <section class="relative mt-8 grid grid-cols-4 gap-3 border-y border-[#e4e4e7] py-5">
      <div v-for="item in stats" :key="item.label">
        <p class="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">{{ item.label }}</p>
        <p class="mt-1 text-2xl font-semibold tracking-tight text-[#18181b]">
          {{ item.value }}<span class="ml-0.5 text-xs font-normal text-[#a1a1aa]">{{ item.unit }}</span>
        </p>
        <p class="mt-1 text-[10px]" :class="item.deltaClass">{{ item.delta }}</p>
      </div>
    </section>

    <section class="relative mt-7 grid grid-cols-[1fr_200px] gap-8">
      <div>
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">本周练习</p>
          <p class="text-[10px] text-[#a1a1aa]">新词 {{ report.summary.newWords }} · 复习 {{ report.summary.reviewCount }}</p>
        </div>
        <div class="mt-4 flex h-32 items-end gap-2">
          <div v-for="day in bars" :key="day.date" class="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div
              class="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-md bg-[#e4e4e7]"
              :style="{ height: `${day.totalHeight}%` }"
              :title="`${day.date} · 新词 ${day.newWords} · 复习 ${day.reviewCount}`"
            >
              <div
                v-if="day.reviewHeight > 0"
                class="w-full bg-[#99f6e4]"
                :style="{ height: `${day.reviewHeight}%` }"
              />
              <div
                v-if="day.newHeight > 0"
                class="w-full bg-[#0f766e]"
                :style="{ height: `${day.newHeight}%` }"
              />
            </div>
            <span class="text-[9px] text-[#a1a1aa]">{{ day.weekday }}</span>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-4 text-[10px] text-[#71717a]">
          <span class="inline-flex items-center gap-1.5"><i class="h-2 w-2 rounded-sm bg-[#0f766e]" />新词</span>
          <span class="inline-flex items-center gap-1.5"><i class="h-2 w-2 rounded-sm bg-[#99f6e4]" />复习</span>
        </div>
      </div>

      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">本周易错词</p>
        <div v-if="report.topWeakWords.length" class="mt-4 space-y-3">
          <div v-for="(word, index) in report.topWeakWords" :key="word.wordId" class="flex gap-2.5">
            <span class="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#e7f5f2] text-[10px] font-semibold text-[#0f766e]">
              {{ index + 1 }}
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-[#18181b]">{{ word.word }}</p>
              <p class="truncate text-[10px] text-[#a1a1aa]">{{ word.translation || `错 ${word.wrongCount} 次` }}</p>
            </div>
          </div>
        </div>
        <p v-else class="mt-4 text-xs leading-5 text-[#a1a1aa]">本周没有明显易错词，继续保持。</p>
        <div v-if="report.topCourses.length" class="mt-5 border-t border-[#e4e4e7] pt-3">
          <p class="text-[10px] text-[#a1a1aa]">主学课程</p>
          <p class="mt-1 truncate text-xs text-[#52525b]">{{ report.topCourses[0]?.name }}</p>
        </div>
      </div>
    </section>

    <section class="relative mt-7 rounded-2xl bg-[#101312] p-5 text-white">
      <p class="text-[10px] uppercase tracking-[0.22em] text-[#5eead4]">Next Week</p>
      <p class="mt-2 text-sm leading-6 text-[#d4d4d8]">{{ nextAction }}</p>
    </section>

    <footer class="relative mt-6 flex items-center justify-between border-t border-[#e4e4e7] pt-4">
      <p class="text-[10px] tracking-[0.12em] text-[#a1a1aa]">ENGLISH APP · LEARN A LITTLE, REMEMBER MORE</p>
      <p class="text-[10px] text-[#a1a1aa]">{{ report.label }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WeeklyReport } from '@en/common/report'

const props = defineProps<{ report: WeeklyReport }>()

const posterEl = ref<HTMLElement | null>(null)
const getElement = () => posterEl.value
defineExpose({ getElement })

const deltaText = (current: number, previous: number | undefined, unit = '') => {
  if (previous === undefined) return '较上周 —'
  const diff = current - previous
  if (diff === 0) return '与上周持平'
  return `较上周 ${diff > 0 ? '+' : ''}${diff}${unit}`
}

const deltaClass = (current: number, previous: number | undefined) => {
  if (previous === undefined || current === previous) return 'text-[#a1a1aa]'
  return current > previous ? 'text-[#0f766e]' : 'text-[#b45309]'
}

const stats = computed(() => {
  const summary = props.report.summary
  const previous = props.report.previous
  return [
    { label: '新词', value: summary.newWords, unit: '词', delta: deltaText(summary.newWords, previous?.newWords, ' 词'), deltaClass: deltaClass(summary.newWords, previous?.newWords) },
    { label: '复习', value: summary.reviewCount, unit: '次', delta: deltaText(summary.reviewCount, previous?.reviewCount, ' 次'), deltaClass: deltaClass(summary.reviewCount, previous?.reviewCount) },
    { label: '学习时长', value: summary.minutes, unit: 'min', delta: deltaText(summary.minutes, previous?.minutes, ' 分钟'), deltaClass: deltaClass(summary.minutes, previous?.minutes) },
    { label: '正确率', value: summary.accuracy, unit: '%', delta: deltaText(summary.accuracy, previous?.accuracy, ' 个百分点'), deltaClass: deltaClass(summary.accuracy, previous?.accuracy) },
  ]
})

const bars = computed(() => {
  const max = Math.max(1, ...props.report.daily.map(day => day.newWords + day.reviewCount || day.totalAttempts))
  return props.report.daily.map(day => {
    const total = day.newWords + day.reviewCount || day.totalAttempts
    const totalHeight = Math.max(4, Math.round((total / max) * 100))
    return {
      ...day,
      totalHeight,
      newHeight: total > 0 ? Math.round((day.newWords / total) * 100) : 0,
      reviewHeight: total > 0 ? Math.round((day.reviewCount / total) * 100) : 0,
    }
  })
})

const nextAction = computed(() => {
  const summary = props.report.summary
  const weakest = props.report.topWeakWords[0]
  if (weakest) return `下周先复习「${weakest.word}」这类易错词，再开新词。`
  if (summary.accuracy > 0 && summary.accuracy < 80) return '下周把正确率拉回 80% 以上，先把错题过一遍。'
  if (summary.reviewCount === 0 && summary.newWords > 0) return '下周给复习留一个固定时间段，别只追新词。'
  return '保持现在的节奏，下周继续学一点。'
})
</script>
