<template>
  <div class="min-h-[calc(100vh-5rem)] bg-[#f7f6f1]">
    <div class="mx-auto w-[1240px] max-w-full px-4 pb-12 pt-6">
      <header class="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-zinc-500 transition-colors hover:text-teal-700"
              @click="goHome"
            >
              <el-icon :size="14"><ArrowLeft /></el-icon>
              返回工作台
            </button>
            <span class="h-3 w-px bg-zinc-200" />
            <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">Weekly Review</p>
          </div>
          <h1 class="mt-2.5 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">学习周报</h1>
          <p class="mt-1.5 text-sm text-zinc-500">把一周的学习收拢成一张纸，看看哪里值得继续。</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex h-9 items-center rounded-xl border border-zinc-200 bg-white p-0.5">
            <el-popover
              v-model:visible="weekMenuOpen"
              placement="bottom-end"
              :width="236"
              :show-arrow="false"
              trigger="click"
              popper-class="week-picker-popover"
            >
              <template #reference>
                <button
                  type="button"
                  class="flex h-8 min-w-[170px] items-center justify-between gap-3 rounded-lg px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-[#fbfaf7]"
                  aria-label="选择周"
                >
                  <span class="truncate">{{ selectedOption?.label }}</span>
                  <span class="flex shrink-0 items-center gap-1">
                    <span v-if="selectedOption?.current" class="rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-medium text-teal-700">本周</span>
                    <el-icon class="text-zinc-400" :size="12"><ArrowDown /></el-icon>
                  </span>
                </button>
              </template>

              <div class="max-h-[280px] overflow-y-auto p-0.5">
                <button
                  v-for="option in weekOptions"
                  :key="option.value"
                  type="button"
                  class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors"
                  :class="option.value === selectedWeek ? 'bg-teal-50 text-teal-800' : 'text-zinc-600 hover:bg-[#fbfaf7]'"
                  @click="selectWeekOption(option.value)"
                >
                  <span>{{ option.label }}</span>
                  <span v-if="option.current" class="text-[9px] font-medium text-teal-700">本周</span>
                  <el-icon v-else-if="option.value === selectedWeek" :size="12"><Check /></el-icon>
                </button>
              </div>
            </el-popover>
          </div>
          <span
            v-if="report?.isCurrentWeek"
            class="rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-medium text-teal-700"
          >
            本周进行中
          </span>
        </div>
      </header>

      <div
        v-if="!userStore.getUser"
        class="mt-8 flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-white px-6 py-16 text-center"
      >
        <div class="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <h2 class="mt-4 text-lg font-semibold text-zinc-950">登录后查看学习周报</h2>
        <p class="mt-2 text-sm text-zinc-500">每周学习数据、易错词和投入分布都会汇总在这里。</p>
        <button type="button" class="btn-ink mt-5 h-10 rounded-xl px-6 text-sm" @click="loginAndLoad">
          登录
        </button>
      </div>

      <div v-else v-loading="loading" class="mt-6 min-h-[480px]">
        <div v-if="error" class="flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-white px-6 py-16 text-center">
          <p class="text-sm text-zinc-500">{{ error }}</p>
          <button type="button" class="btn-ink mt-4 h-9 rounded-xl px-5 text-xs" @click="load">重新加载</button>
        </div>

        <template v-else-if="report">
          <div
            v-if="!hasData"
            class="flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-white px-6 py-16 text-center"
          >
            <div class="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <el-icon :size="24"><Calendar /></el-icon>
            </div>
            <h2 class="mt-4 text-lg font-semibold text-zinc-950">这一周还没有学习记录</h2>
            <p class="mt-2 max-w-[420px] text-sm leading-6 text-zinc-500">
              选择其他周看看，或者去完成一组练习。下周的周报会从第一组单词开始记录。
            </p>
            <div class="mt-5 flex gap-2">
              <button type="button" class="btn-ink h-9 rounded-xl px-5 text-xs" @click="goLearn">
                去学习
              </button>
              <button
                v-if="selectedIndex < weekOptions.length - 1"
                type="button"
                class="h-9 rounded-xl border border-zinc-300 px-5 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700"
                @click="moveWeek(1)"
              >
                看上一周
              </button>
            </div>
          </div>

          <template v-else>
            <section class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <div v-for="item in kpis" :key="item.label" class="rounded-2xl border border-zinc-200/80 bg-white px-4 py-3">
                <p class="text-[11px] uppercase tracking-[0.14em] text-zinc-400">{{ item.label }}</p>
                <p class="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-950">
                  {{ item.value }}<span class="ml-0.5 text-xs font-normal text-zinc-400">{{ item.unit }}</span>
                </p>
                <p class="mt-1 text-[11px]" :class="item.deltaTone">{{ item.delta }}</p>
              </div>
            </section>

            <p class="mt-4 text-xs text-zinc-500 sm:hidden">左右滑动查看完整周报</p>
            <div class="mt-2 grid gap-5 sm:mt-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <section class="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-[#e7e5df] p-3 sm:p-6">
                <div class="mx-auto w-[700px] shadow-2xl shadow-zinc-950/10">
                  <ReportPoster ref="posterRef" :report="report" />
                </div>
              </section>

              <aside class="space-y-4">
                <section class="rounded-2xl border border-zinc-200/80 bg-white p-5">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-700">Reading</p>
                  <h2 class="mt-2 text-lg font-semibold tracking-tight text-zinc-950">本周解读</h2>
                  <p class="mt-2 text-sm leading-6 text-zinc-600">{{ report.comment }}</p>
                  <ul v-if="insights.length" class="mt-4 space-y-2.5 border-t border-zinc-100 pt-4">
                    <li v-for="item in insights" :key="item" class="flex gap-2 text-xs leading-5 text-zinc-500">
                      <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-700" />
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </section>

                <section class="rounded-2xl border border-zinc-200/80 bg-white p-5">
                  <h2 class="text-sm font-semibold text-zinc-950">导出与分享</h2>
                  <p class="mt-1 text-xs leading-5 text-zinc-500">导出这张周报，留作自己的学习记录。</p>
                  <div class="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      class="btn-ink inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="exporting !== null"
                      @click="exportImage"
                    >
                      <el-icon :size="14"><Picture /></el-icon>
                      {{ exporting === 'image' ? '生成中…' : '保存图片' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="exporting !== null"
                      @click="exportPdf"
                    >
                      <el-icon :size="14"><Download /></el-icon>
                      {{ exporting === 'pdf' ? '生成中…' : '保存 PDF' }}
                    </button>
                  </div>
                  <button
                    type="button"
                    class="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="exporting !== null"
                    @click="shareImage"
                  >
                    <el-icon :size="14"><Share /></el-icon>
                    分享图片
                  </button>
                </section>

                <p class="px-1 text-[11px] leading-5 text-zinc-400">
                  周报只根据你的学习记录生成，不包含公开分享链接。换设备后登录同一账号仍可查看。
                </p>
              </aside>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  ArrowLeft,
  Calendar,
  Check,
  Document,
  Download,
  Picture,
  Share,
} from '@element-plus/icons-vue'
import { getWeeklyReport } from '@/apis/report'
import { useUserStore } from '@/stores/user'
import { useLogin } from '@/hooks/useLogin'
import type { WeeklyReport } from '@en/common/report'
import ReportPoster from './components/ReportPoster.vue'

const router = useRouter()
const userStore = useUserStore()
const { login } = useLogin()

const addDays = (key: string, days: number) => {
  const date = new Date(`${key}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const mondayOf = (key: string) => {
  const date = new Date(`${key}T00:00:00Z`)
  const offset = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - offset)
  return date.toISOString().slice(0, 10)
}

const shortDate = (key: string) => {
  const date = new Date(`${key}T00:00:00Z`)
  return `${date.getUTCMonth() + 1}.${date.getUTCDate()}`
}

const todayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

const currentMonday = mondayOf(todayKey)
const lastCompletedWeek = addDays(currentMonday, -7)

const weekOptions = computed(() => {
  const keys = [
    currentMonday,
    ...Array.from({ length: 11 }, (_, index) => addDays(lastCompletedWeek, -index * 7)),
  ]
  return keys.map(value => ({
    value,
    label: `${shortDate(value)} - ${shortDate(addDays(value, 6))}`,
    current: value === currentMonday,
  }))
})

const selectedWeek = ref(lastCompletedWeek)
const selectedIndex = computed(() => weekOptions.value.findIndex(option => option.value === selectedWeek.value))
const selectedOption = computed(() => weekOptions.value.find(option => option.value === selectedWeek.value))
const weekMenuOpen = ref(false)

const report = ref<WeeklyReport | null>(null)
const loading = ref(false)
const error = ref('')

const hasData = computed(() => {
  if (!report.value) return false
  return report.value.summary.studyDays > 0
    || report.value.summary.newWords > 0
    || report.value.summary.totalAttempts > 0
})

const deltaText = (current: number, previous: number | undefined, unit: string, point = false) => {
  if (previous === undefined) return '较上周 —'
  const diff = current - previous
  if (diff === 0) return '与上周持平'
  return `较上周 ${diff > 0 ? '+' : ''}${diff}${point ? ' 个百分点' : unit}`
}

const deltaClass = (current: number, previous: number | undefined) => {
  if (previous === undefined || current === previous) return 'text-zinc-400'
  return current > previous ? 'text-teal-700' : 'text-amber-700'
}

const kpis = computed(() => {
  if (!report.value) return []
  const summary = report.value.summary
  const previous = report.value.previous
  return [
    { label: '学习天数', value: summary.studyDays, unit: '天', delta: deltaText(summary.studyDays, previous?.studyDays, ' 天'), deltaTone: deltaClass(summary.studyDays, previous?.studyDays) },
    { label: '新词', value: summary.newWords, unit: '词', delta: deltaText(summary.newWords, previous?.newWords, ' 词'), deltaTone: deltaClass(summary.newWords, previous?.newWords) },
    { label: '复习', value: summary.reviewCount, unit: '次', delta: deltaText(summary.reviewCount, previous?.reviewCount, ' 次'), deltaTone: deltaClass(summary.reviewCount, previous?.reviewCount) },
    { label: '学习时长', value: summary.minutes, unit: 'min', delta: deltaText(summary.minutes, previous?.minutes, ' 分钟'), deltaTone: deltaClass(summary.minutes, previous?.minutes) },
    { label: '正确率', value: summary.accuracy, unit: '%', delta: deltaText(summary.accuracy, previous?.accuracy, '%', true), deltaTone: deltaClass(summary.accuracy, previous?.accuracy) },
    { label: '打卡', value: summary.checkInDays, unit: '天', delta: deltaText(summary.checkInDays, previous?.checkInDays, ' 天'), deltaTone: deltaClass(summary.checkInDays, previous?.checkInDays) },
  ]
})

const insights = computed(() => {
  if (!report.value) return []
  const summary = report.value.summary
  const previous = report.value.previous
  const items: string[] = []

  if (previous) {
    if (summary.minutes > previous.minutes) {
      items.push(`学习时长比上周多 ${summary.minutes - previous.minutes} 分钟，节奏在变稳。`)
    } else if (summary.minutes < previous.minutes) {
      items.push(`学习时长比上周少 ${previous.minutes - summary.minutes} 分钟，下周可以先把时间找回来。`)
    }
    if (summary.newWords !== previous.newWords) {
      items.push(summary.newWords > previous.newWords
        ? `新词比上周多 ${summary.newWords - previous.newWords} 个，输入量在增加。`
        : `新词比上周少 ${previous.newWords - summary.newWords} 个，可以把目标拆小一点。`)
    }
  }

  const weakest = report.value.topWeakWords[0]
  if (weakest) {
    items.push(`最需要复习的是「${weakest.word}」，本周错了 ${weakest.wrongCount} 次。`)
  } else if (summary.totalAttempts > 0) {
    items.push('本周没有明显易错词，正确率保持得不错。')
  }

  if (summary.reviewCount === 0 && summary.newWords > 0) {
    items.push('本周只学了新词，建议安排一次复习，把短期记忆接上。')
  } else if (summary.studyDays >= 5) {
    items.push(`本周有 ${summary.studyDays} 天在学习，稳定比突击更有价值。`)
  }

  return items.slice(0, 3)
})

const load = async () => {
  if (!userStore.getUser) return
  loading.value = true
  error.value = ''
  try {
    const response = await getWeeklyReport(selectedWeek.value)
    if (!response.success) throw new Error(response.message || '周报加载失败')
    report.value = response.data
  } catch (err) {
    report.value = null
    error.value = err instanceof Error ? err.message : '周报加载失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

const loginAndLoad = async () => {
  const ok = await login()
  if (ok) await load()
}

const moveWeek = (delta: number) => {
  const next = weekOptions.value[selectedIndex.value + delta]
  if (next) selectedWeek.value = next.value
}

const selectWeekOption = (value: string) => {
  selectedWeek.value = value
  weekMenuOpen.value = false
}

const goHome = () => router.push('/')
const goLearn = () => router.push('/courses/index')

watch(selectedWeek, () => {
  if (userStore.getUser) load()
})

watch(
  () => userStore.user?.id,
  id => {
    if (id && !report.value && !loading.value) load()
  },
)

onMounted(() => {
  if (userStore.getUser) load()
})

type PosterInstance = { getElement: () => HTMLElement | null }
const posterRef = ref<PosterInstance | null>(null)
const exporting = ref<'image' | 'pdf' | null>(null)

const posterNode = () => posterRef.value?.getElement() ?? null

const filename = (extension: string) =>
  `学习周报-${report.value?.weekStart ?? selectedWeek.value}.${extension}`

const renderPoster = async () => {
  const node = posterNode()
  if (!node) throw new Error('周报还没有准备好')
  const { toPng } = await import('html-to-image')
  return toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#f7f6f1',
  })
}

const download = (dataUrl: string, extension: string) => {
  const link = document.createElement('a')
  link.download = filename(extension)
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const exportImage = async () => {
  if (exporting.value) return
  exporting.value = 'image'
  try {
    const dataUrl = await renderPoster()
    download(dataUrl, 'png')
    ElMessage.success('周报图片已保存')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '图片生成失败')
  } finally {
    exporting.value = null
  }
}

const exportPdf = async () => {
  if (exporting.value) return
  exporting.value = 'pdf'
  try {
    const node = posterNode()
    if (!node) throw new Error('周报还没有准备好')
    const dataUrl = await renderPoster()
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 24
    const ratio = node.offsetHeight / node.offsetWidth
    let width = pageWidth - margin * 2
    let height = width * ratio
    if (height > pageHeight - margin * 2) {
      height = pageHeight - margin * 2
      width = height / ratio
    }
    pdf.addImage(dataUrl, 'PNG', (pageWidth - width) / 2, margin, width, height)
    pdf.save(filename('pdf'))
    ElMessage.success('周报 PDF 已保存')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'PDF 生成失败')
  } finally {
    exporting.value = null
  }
}

const shareImage = async () => {
  if (exporting.value) return
  exporting.value = 'image'
  try {
    const dataUrl = await renderPoster()
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], filename('png'), { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean }
    if (nav.share && nav.canShare?.({ files: [file] } as ShareData)) {
      await nav.share({ files: [file], title: '我的学习周报' } as ShareData)
    } else {
      download(dataUrl, 'png')
      ElMessage.success('当前浏览器不支持直接分享，已保存图片')
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    ElMessage.error(err instanceof Error ? err.message : '分享失败')
  } finally {
    exporting.value = null
  }
}
</script>
