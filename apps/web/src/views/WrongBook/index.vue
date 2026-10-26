<template>
  <div class="min-h-[calc(100vh-5rem)] bg-[#f7f6f1]">
    <div class="mx-auto w-[1100px] max-w-full px-4 pb-24 pt-12">
      <header class="border-b border-zinc-200 pb-8">
        <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">
          Wrong Book
        </p>
        <div class="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div class="flex items-center gap-2">
              <el-icon class="text-teal-700" :size="20"><Collection /></el-icon>
              <h1 class="text-3xl font-semibold tracking-tight text-zinc-950">错词本</h1>
            </div>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              所有答错过的词都会留在这里。重置 SRS 会重新安排间隔，移出后不再出现在错词本。
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-teal-300 hover:bg-teal-50/50"
            @click="router.push('/courses/index')"
          >
            <el-icon :size="15"><Reading /></el-icon>
            去课程学习
          </button>
        </div>
      </header>

      <div
        v-if="!userStore.getUser"
        class="mt-10 flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-white px-6 py-20 text-center"
      >
        <div class="grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <el-icon :size="26"><Collection /></el-icon>
        </div>
        <h2 class="mt-5 text-lg font-semibold text-zinc-950">登录后查看错词本</h2>
        <p class="mt-2 text-sm text-zinc-500">答错过的单词会按时间保存在你的账号里。</p>
        <button
          type="button"
          class="btn-ink mt-6 h-11 rounded-xl px-6 text-sm"
          @click="loginAndLoad"
        >
          登录
        </button>
      </div>

      <template v-else>
        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="rounded-2xl border border-zinc-200/80 bg-white p-5">
            <p class="text-xs text-zinc-500">错词总数</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              {{ data?.wrongWordCount ?? 0 }}
              <span class="text-sm font-normal text-zinc-400">个</span>
            </p>
          </div>
          <div class="rounded-2xl border border-zinc-200/80 bg-white p-5">
            <p class="text-xs text-zinc-500">今日到期</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-teal-700">
              {{ data?.dueCount ?? 0 }}
              <span class="text-sm font-normal text-zinc-400">个</span>
            </p>
          </div>
          <div class="rounded-2xl border border-zinc-200/80 bg-[#fbfaf7] p-5">
            <p class="text-xs text-zinc-500">建议</p>
            <p class="mt-2 text-sm leading-6 text-zinc-600">
              先复习到期词，再处理零散的错词。
            </p>
          </div>
        </div>

        <div v-loading="loading" class="mt-6 space-y-3">
          <article
            v-for="item in data?.list ?? []"
            :key="item.recordId"
            class="rounded-2xl border border-zinc-200/80 bg-white p-5 transition-colors hover:border-teal-200 sm:p-6"
          >
            <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 class="text-xl font-semibold tracking-tight text-zinc-950">
                    {{ item.word }}
                  </h2>
                  <span
                    v-if="item.phonetic"
                    class="text-xs tracking-wide text-zinc-400"
                  >
                    {{ item.phonetic }}
                  </span>
                  <span
                    v-if="item.courseName"
                    class="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700"
                  >
                    {{ item.courseName }}
                  </span>
                </div>
                <p class="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-6 text-zinc-600">
                  {{ formatText(item.translation || item.definition) }}
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <span>答错 {{ item.wrongCount }} 次</span>
                  <span>掌握度 {{ item.progress.mastery }}/5</span>
                  <span>下次 {{ formatReviewAt(item.progress.nextReviewAt) }}</span>
                </div>
              </div>

              <div class="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!item.courseId"
                  @click="reviewWord(item)"
                >
                  复习
                </button>
                <button
                  type="button"
                  class="h-9 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition-colors hover:border-teal-200 hover:text-teal-700"
                  :disabled="acting === item.recordId"
                  @click="handleReset(item)"
                >
                  重置 SRS
                </button>
                <button
                  type="button"
                  class="h-9 rounded-lg px-3 text-sm text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="acting === item.recordId"
                  @click="handleRemove(item)"
                >
                  移出
                </button>
              </div>
            </div>
          </article>

          <div
            v-if="!loading && !(data?.list.length)"
            class="flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-20 text-center"
          >
            <div class="grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <el-icon :size="26"><CircleCheck /></el-icon>
            </div>
            <h2 class="mt-5 text-lg font-semibold text-zinc-950">错词本是空的</h2>
            <p class="mt-2 text-sm text-zinc-500">继续学习，答错的词会自动收进来。</p>
            <button
              type="button"
              class="btn-ink mt-6 h-10 rounded-xl px-5 text-sm"
              @click="router.push('/courses/index')"
            >
              去学习
            </button>
          </div>
        </div>

        <el-pagination
          v-if="(data?.total ?? 0) > pageSize"
          class="mt-8 flex justify-center"
          background
          layout="prev, pager, next"
          :current-page="page"
          :page-size="pageSize"
          :total="data?.total ?? 0"
          @current-change="changePage"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheck,
  Collection,
  Reading,
} from '@element-plus/icons-vue'
import type { WrongBookItem, WrongBookList } from '@en/common/learn'
import { getWrongBook, removeWrongWord, resetReview } from '@/apis/learn'
import { useUserStore } from '@/stores/user'
import { useLogin } from '@/hooks/useLogin'

const router = useRouter()
const userStore = useUserStore()
const { login } = useLogin()

const data = ref<WrongBookList | null>(null)
const loading = ref(false)
const acting = ref('')
const page = ref(1)
const pageSize = 20

const formatText = (text?: string) =>
  (text ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')

const formatReviewAt = (value?: string | Date | null) => {
  if (!value) return '未安排'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未安排'
  return date.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
  })
}

const load = async () => {
  loading.value = true
  try {
    const res = await getWrongBook(page.value, pageSize)
    if (!res.success) {
      ElMessage.error(res.message)
      return
    }
    data.value = res.data
    if (!res.data.list.length && res.data.total > 0 && page.value > 1) {
      page.value -= 1
      await load()
    }
  } finally {
    loading.value = false
  }
}

const loginAndLoad = async () => {
  const ok = await login()
  if (ok) await load()
}

const changePage = async (value: number) => {
  page.value = value
  await load()
}

const reviewWord = (item: WrongBookItem) => {
  if (!item.courseId) return
  router.push({
    path: `/review/index/${item.courseId}/${encodeURIComponent(item.courseName ?? '复习')}`,
    query: { wordId: item.id },
  })
}

const handleReset = async (item: WrongBookItem) => {
  try {
    await ElMessageBox.confirm(
      `重置「${item.word}」的 SRS 进度？它会重新从 1 天间隔开始。`,
      '重置复习进度',
      { confirmButtonText: '重置', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  acting.value = item.recordId
  try {
    const res = await resetReview(item.recordId)
    if (!res.success) {
      ElMessage.error(res.message)
      return
    }
    ElMessage.success('已重置 SRS')
    await load()
  } finally {
    acting.value = ''
  }
}

const handleRemove = async (item: WrongBookItem) => {
  try {
    await ElMessageBox.confirm(
      `把「${item.word}」移出错词本？重置进度后它仍可能再次出现。`,
      '移出错词本',
      { confirmButtonText: '移出', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  acting.value = item.recordId
  try {
    const res = await removeWrongWord(item.id)
    if (!res.success) {
      ElMessage.error(res.message)
      return
    }
    ElMessage.success('已移出错词本')
    await load()
  } finally {
    acting.value = ''
  }
}

watch(
  () => userStore.user?.id,
  (id) => {
    if (id && !data.value && !loading.value) load()
  },
)

onMounted(() => {
  if (userStore.getUser) load()
})
</script>
