<template>
  <div class="min-h-[calc(100vh-5rem)] bg-[#f7f6f1]">
    <div class="mx-auto w-[1100px] max-w-full px-4 pb-24 pt-12">
      <header class="border-b border-zinc-200 pb-8">
        <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">
          Study Plan
        </p>
        <div class="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 class="text-3xl font-semibold tracking-tight text-zinc-950">学习计划</h1>
            <p class="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
              把每天的目标拆小一点，按自己的节奏完成。学习结束后会自动打卡。
            </p>
          </div>
          <el-button
            v-if="summary && !editing"
            class="!rounded-xl !border-zinc-300 !text-zinc-700"
            plain
            @click="startEdit"
          >
            调整目标
          </el-button>
        </div>
      </header>

      <div
        v-if="!userStore.getUser"
        class="mt-10 flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-white px-6 py-20 text-center"
      >
        <div class="grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <el-icon :size="26"><Calendar /></el-icon>
        </div>
        <h2 class="mt-5 text-lg font-semibold text-zinc-950">登录后查看学习计划</h2>
        <p class="mt-2 text-sm text-zinc-500">目标、打卡和错词都会跟随你的账号保存。</p>
        <button
          type="button"
          class="btn-ink mt-6 h-11 rounded-xl px-6 text-sm"
          @click="loginAndLoad"
        >
          登录
        </button>
      </div>

      <div
        v-else
        v-loading="loading"
        class="mt-8 space-y-6"
      >
        <div class="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <section class="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-sm text-zinc-500">
                <span class="h-1.5 w-1.5 rounded-full bg-teal-700" />
                {{ todayLabel }}
              </div>
              <span
                class="rounded-full px-3 py-1 text-xs font-medium"
                :class="summary?.completed
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-zinc-100 text-zinc-500'"
              >
                {{ summary?.completed ? '今日目标已完成' : '进行中' }}
              </span>
            </div>

            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">
              今天，学一点。
            </h2>
            <p class="mt-2 text-sm leading-6 text-zinc-500">
              完成新词、复习和时长目标后，今天就算圆满收工。
            </p>

            <div class="mt-8 space-y-6">
              <div v-for="item in progressItems" :key="item.key">
                <div class="flex items-baseline justify-between gap-3">
                  <span class="text-sm font-medium text-zinc-800">{{ item.label }}</span>
                  <span class="text-sm tabular-nums text-zinc-500">
                    <strong class="font-semibold text-zinc-950">{{ item.value }}</strong>
                    <span class="mx-1 text-zinc-300">/</span>
                    <span>{{ item.goal ? `${item.goal}${item.unit}` : '未设置' }}</span>
                  </span>
                </div>
                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    class="h-full rounded-full bg-teal-700 transition-all duration-500"
                    :style="{ width: `${item.percent}%` }"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="editing"
              class="mt-7 rounded-xl border border-teal-100 bg-teal-50/50 p-4"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                每日目标
              </p>
              <div class="mt-4 grid gap-4 sm:grid-cols-3">
                <label class="block">
                  <span class="text-xs text-zinc-500">新词</span>
                  <el-input-number
                    v-model="draft.dailyNew"
                    class="mt-1.5 w-full"
                    :min="0"
                    :max="100"
                    :step="5"
                    controls-position="right"
                  />
                </label>
                <label class="block">
                  <span class="text-xs text-zinc-500">复习</span>
                  <el-input-number
                    v-model="draft.dailyReview"
                    class="mt-1.5 w-full"
                    :min="0"
                    :max="200"
                    :step="10"
                    controls-position="right"
                  />
                </label>
                <label class="block">
                  <span class="text-xs text-zinc-500">时长（分钟）</span>
                  <el-input-number
                    v-model="draft.dailyMinutes"
                    class="mt-1.5 w-full"
                    :min="0"
                    :max="300"
                    :step="5"
                    controls-position="right"
                  />
                </label>
              </div>
              <div class="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  class="h-10 rounded-xl border border-zinc-300 px-4 text-sm text-zinc-600 transition-colors hover:bg-white"
                  @click="editing = false"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="h-10 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="saving"
                  @click="saveGoals"
                >
                  {{ saving ? '保存中…' : '保存目标' }}
                </button>
              </div>
            </div>

            <div v-else class="mt-8 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-6">
              <button
                type="button"
                class="btn-ink inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"
                @click="goCourses"
              >
                <el-icon :size="16"><Reading /></el-icon>
                开始学习
              </button>
              <button
                type="button"
                class="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-teal-300 hover:bg-teal-50/50"
                @click="goCourses"
              >
                去复习
                <span
                  v-if="summary?.dueReviewCount"
                  class="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700"
                >
                  {{ summary.dueReviewCount }}
                </span>
              </button>
              <button
                type="button"
                class="ml-auto inline-flex h-11 items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-teal-700"
                @click="router.push('/wrong-book/index')"
              >
                错词本
                <el-icon :size="14"><ArrowRight /></el-icon>
              </button>
            </div>
          </section>

          <aside class="relative order-first overflow-hidden rounded-2xl bg-[#101312] p-7 text-white lg:order-last">
            <div
              class="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl"
            />
            <div class="relative">
              <div class="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-teal-300">
                <el-icon :size="15"><Sunny /></el-icon>
                Streak
              </div>
              <div class="mt-8 flex items-end gap-2">
                <span class="text-6xl font-semibold leading-none tracking-[-0.05em]">
                  {{ summary?.streak ?? 0 }}
                </span>
                <span class="pb-1 text-sm text-zinc-400">天连续打卡</span>
              </div>
              <p class="mt-3 max-w-[220px] text-sm leading-6 text-zinc-400">
                每天完成一点，连续记录会留在这里。
              </p>

              <div class="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-zinc-300">今日打卡</span>
                  <span
                    class="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    :class="summary?.checkIn
                      ? 'bg-teal-400/15 text-teal-300'
                      : 'bg-white/5 text-zinc-400'"
                  >
                    {{ summary?.checkIn ? '已完成' : '待完成' }}
                  </span>
                </div>
                <p class="mt-2 text-xs leading-5 text-zinc-500">
                  {{ summary?.checkIn
                    ? `今天已学习 ${summary.checkIn.words} 个词，累计 ${summary.checkIn.minutes} 分钟。`
                    : '完成一组学习或复习后会自动打卡，也可以手动打卡。' }}
                </p>
                <button
                  v-if="!summary?.checkIn"
                  type="button"
                  class="mt-4 h-10 w-full rounded-xl border border-teal-400/30 bg-teal-400/10 text-sm font-medium text-teal-200 transition-colors hover:bg-teal-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!canCheckIn || checkingIn"
                  @click="handleCheckIn"
                >
                  {{ checkingIn ? '打卡中…' : canCheckIn ? '打卡' : '先学习再打卡' }}
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div class="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <section class="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-700">
                  Check-in
                </p>
                <h2 class="mt-2 text-xl font-semibold tracking-tight text-zinc-950">打卡日历</h2>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="上个月"
                  class="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-teal-200 hover:text-teal-700"
                  @click="shiftMonth(-1)"
                >
                  <el-icon :size="14"><ArrowLeft /></el-icon>
                </button>
                <span class="w-24 text-center text-sm font-medium text-zinc-700">{{ monthLabel }}</span>
                <button
                  type="button"
                  aria-label="下个月"
                  class="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-teal-200 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30"
                  :disabled="month >= currentMonth"
                  @click="shiftMonth(1)"
                >
                  <el-icon :size="14"><ArrowRight /></el-icon>
                </button>
              </div>
            </div>

            <div class="mt-7 grid grid-cols-7 gap-1.5 text-center">
              <span
                v-for="weekday in weekdays"
                :key="weekday"
                class="pb-1 text-[11px] font-medium text-zinc-400"
              >
                {{ weekday }}
              </span>
              <template v-for="(cell, index) in calendarCells" :key="cell?.date ?? `blank-${index}`">
                <span v-if="!cell" class="aspect-square" />
                <div
                  v-else
                  class="flex aspect-square flex-col items-center justify-center rounded-xl text-xs transition-colors"
                  :class="dayClass(cell)"
                  :title="cell.checkedIn ? `${cell.date} · ${cell.words} 词 · ${cell.minutes} 分钟` : cell.date"
                >
                  <span class="font-medium">{{ Number(cell.date.slice(-2)) }}</span>
                  <span
                    v-if="cell.checkedIn"
                    class="mt-1 h-1 w-1 rounded-full bg-white/80"
                  />
                </div>
              </template>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-400">
              <span>本月已打卡 {{ calendar?.checkedInDays ?? 0 }} 天</span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-teal-700" />
                已打卡
              </span>
            </div>
          </section>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <button
              type="button"
              class="group rounded-2xl border border-zinc-200/80 bg-white p-6 text-left transition-all hover:border-teal-200 hover:shadow-[0_20px_50px_-38px_rgba(15,118,110,0.35)]"
              @click="router.push('/wrong-book/index')"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <el-icon :size="19"><Collection /></el-icon>
                </div>
                <el-icon class="text-zinc-300 transition-colors group-hover:text-teal-700" :size="16">
                  <ArrowRight />
                </el-icon>
              </div>
              <p class="mt-5 text-sm text-zinc-500">错词本</p>
              <p class="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                {{ summary?.wrongBookCount ?? 0 }}
                <span class="text-sm font-normal text-zinc-400">个待巩固</span>
              </p>
              <p class="mt-2 text-xs leading-5 text-zinc-400">
                答错过的词会留在这里，可以单独复习或移出。
              </p>
            </button>

            <button
              type="button"
              class="group rounded-2xl border border-zinc-200/80 bg-[#fbfaf7] p-6 text-left transition-all hover:border-teal-200"
              @click="goCourses"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="grid h-10 w-10 place-items-center rounded-xl bg-white text-teal-700 shadow-sm">
                  <el-icon :size="19"><Refresh /></el-icon>
                </div>
                <el-icon class="text-zinc-300 transition-colors group-hover:text-teal-700" :size="16">
                  <ArrowRight />
                </el-icon>
              </div>
              <p class="mt-5 text-sm text-zinc-500">今日待复习</p>
              <p class="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                {{ summary?.dueReviewCount ?? 0 }}
                <span class="text-sm font-normal text-zinc-400">个到期</span>
              </p>
              <p class="mt-2 text-xs leading-5 text-zinc-400">
                到期的词会按 SRS 间隔安排，去课程里开始一轮复习。
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Collection,
  Reading,
  Refresh,
  Sunny,
} from '@element-plus/icons-vue'
import type {
  CheckInCalendar,
  CheckInCalendarDay,
  StudyGoalSummary,
} from '@en/common/learn'
import {
  checkIn,
  getCheckInCalendar,
  getStudyGoals,
  updateStudyGoals,
} from '@/apis/learn'
import { useUserStore } from '@/stores/user'
import { useLogin } from '@/hooks/useLogin'

const router = useRouter()
const userStore = useUserStore()
const { login } = useLogin()

const summary = ref<StudyGoalSummary | null>(null)
const calendar = ref<CheckInCalendar | null>(null)
const loading = ref(false)
const saving = ref(false)
const checkingIn = ref(false)
const editing = ref(false)
const draft = reactive({ dailyNew: 10, dailyReview: 20, dailyMinutes: 15 })
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

const currentMonth = (() => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
  return today.slice(0, 7)
})()
const month = ref(currentMonth)

const todayLabel = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date()),
)

const monthLabel = computed(() => {
  const [year, value] = month.value.split('-')
  return `${year}年${Number(value)}月`
})

const dayClass = (cell: CheckInCalendarDay) => {
  if (cell.checkedIn) return 'bg-teal-700 text-white'
  if (cell.date === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })) {
    return 'border border-teal-700/40 text-teal-700'
  }
  return 'text-zinc-500 hover:bg-zinc-50'
}

const calendarCells = computed<Array<CheckInCalendarDay | null>>(() => {
  if (!calendar.value) return []
  const dateParts = calendar.value.month.split('-')
  const year = Number(dateParts[0] ?? 0)
  const monthValue = Number(dateParts[1] ?? 1)
  const firstWeekday = (new Date(Date.UTC(year, monthValue - 1, 1)).getUTCDay() + 6) % 7
  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...calendar.value.days,
  ]
})

const goal = computed(() => summary.value?.goal ?? { dailyNew: 10, dailyReview: 20, dailyMinutes: 15 })
const progress = computed(() => summary.value?.progress ?? {
  date: '',
  newWords: 0,
  reviewWords: 0,
  minutes: 0,
})

const percent = (value: number, target: number) =>
  target <= 0 ? 0 : Math.min(100, Math.round((value / target) * 100))

const progressItems = computed(() => [
  {
    key: 'new',
    label: '新词',
    value: progress.value.newWords,
    goal: goal.value.dailyNew,
    unit: ' 个',
    percent: percent(progress.value.newWords, goal.value.dailyNew),
  },
  {
    key: 'review',
    label: '复习',
    value: progress.value.reviewWords,
    goal: goal.value.dailyReview,
    unit: ' 个',
    percent: percent(progress.value.reviewWords, goal.value.dailyReview),
  },
  {
    key: 'minutes',
    label: '学习时长',
    value: progress.value.minutes,
    goal: goal.value.dailyMinutes,
    unit: ' 分钟',
    percent: percent(progress.value.minutes, goal.value.dailyMinutes),
  },
])

const canCheckIn = computed(() =>
  Boolean(summary.value && !summary.value.checkIn
    && (progress.value.newWords > 0 || progress.value.reviewWords > 0 || progress.value.minutes > 0)),
)

const loadCalendar = async () => {
  const res = await getCheckInCalendar(month.value)
  if (res.success) calendar.value = res.data
}

const load = async () => {
  loading.value = true
  try {
    const res = await getStudyGoals()
    if (!res.success) {
      ElMessage.error(res.message)
      return
    }
    summary.value = res.data
    draft.dailyNew = res.data.goal.dailyNew
    draft.dailyReview = res.data.goal.dailyReview
    draft.dailyMinutes = res.data.goal.dailyMinutes
    await loadCalendar()
  } finally {
    loading.value = false
  }
}

const loginAndLoad = async () => {
  const ok = await login()
  if (ok) await load()
}

const startEdit = () => {
  if (!summary.value) return
  draft.dailyNew = summary.value.goal.dailyNew
  draft.dailyReview = summary.value.goal.dailyReview
  draft.dailyMinutes = summary.value.goal.dailyMinutes
  editing.value = true
}

const saveGoals = async () => {
  saving.value = true
  try {
    const res = await updateStudyGoals({ ...draft })
    if (!res.success) {
      ElMessage.error(res.message)
      return
    }
    summary.value = res.data
    editing.value = false
    ElMessage.success('每日目标已更新')
  } finally {
    saving.value = false
  }
}

const handleCheckIn = async () => {
  checkingIn.value = true
  try {
    const res = await checkIn()
    if (!res.success) {
      ElMessage.error(res.message)
      return
    }
    await load()
    ElMessage.success('打卡成功')
  } finally {
    checkingIn.value = false
  }
}

const shiftMonth = async (delta: number) => {
  const monthParts = month.value.split('-')
  const year = Number(monthParts[0] ?? 0)
  const value = Number(monthParts[1] ?? 1)
  const date = new Date(Date.UTC(year, value - 1 + delta, 1))
  const next = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  if (next > currentMonth) return
  month.value = next
  await loadCalendar()
}

const goCourses = () => router.push('/courses/index')

watch(
  () => userStore.user?.id,
  (id) => {
    if (id && !summary.value && !loading.value) load()
  },
)

onMounted(() => {
  if (userStore.getUser) load()
})
</script>
