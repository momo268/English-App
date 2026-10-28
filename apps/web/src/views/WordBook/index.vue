<template>
  <div class="mx-auto w-[1200px] max-w-full px-4 pb-20 pt-10">
    <header class="border-b border-zinc-200 pb-8">
      <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">
        Word Library
      </p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div class="flex items-center gap-2">
            <el-icon class="text-teal-700" :size="20"><Reading /></el-icon>
            <h1 class="text-3xl font-semibold tracking-tight text-zinc-950">词库</h1>
          </div>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
            查公共词库，或导入自己的词库。自定义词库可用于整理和查看，学习请通过自定义课程。
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-sm"
          @click="openImport"
        >
          <el-icon :size="16"><Upload /></el-icon>
          导入词库
        </button>
      </div>
    </header>

    <div class="mt-6 flex items-center gap-7 border-b border-zinc-200">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="relative -mb-px flex items-center gap-1.5 border-b-2 px-0.5 py-3 text-sm transition-colors"
        :class="
          activeTab === tab.value
            ? 'border-teal-700 font-semibold text-zinc-950'
            : 'border-transparent text-zinc-500 hover:text-zinc-900'
        "
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
        <el-icon v-if="tab.value === 'mine' && !userStore.getUser" :size="13"><Lock /></el-icon>
      </button>
    </div>

    <template v-if="activeTab === 'public'">
      <section class="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5">
        <div class="flex flex-wrap items-center gap-3">
          <el-input
            v-model="query.word"
            class="w-full sm:w-80"
            placeholder="请输入单词"
            :prefix-icon="Search"
            @keyup.enter="searchWord"
          />
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
            <el-checkbox v-model="query.gk">高考</el-checkbox>
            <el-checkbox v-model="query.zk">中考</el-checkbox>
            <el-checkbox v-model="query.gre">GRE</el-checkbox>
            <el-checkbox v-model="query.toefl">TOEFL</el-checkbox>
            <el-checkbox v-model="query.ielts">IELTS</el-checkbox>
            <el-checkbox v-model="query.cet6">六级</el-checkbox>
            <el-checkbox v-model="query.cet4">四级</el-checkbox>
            <el-checkbox v-model="query.ky">考研</el-checkbox>
          </div>
          <el-button class="btn-ink h-10 px-5" @click="searchWord">搜索</el-button>
          <span class="ml-auto text-xs text-zinc-400">共 {{ total }} 个词条</span>
        </div>
      </section>

      <div
        v-loading="loading"
        class="mt-6 grid min-h-40 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <article
          v-for="item in list"
          :key="item.id"
          class="group flex min-h-[210px] flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 transition-all duration-200 hover:border-teal-200 hover:shadow-[0_20px_50px_-38px_rgba(15,118,110,0.35)]"
        >
          <div class="flex items-start justify-between gap-3">
            <h2 class="text-lg font-semibold tracking-tight text-zinc-950">{{ item.word }}</h2>
            <button
              type="button"
              aria-label="播放发音"
              class="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-teal-700 transition-colors hover:bg-teal-50"
              @click="playAudio(item.word)"
            >
              <el-icon :size="17"><VideoPlay /></el-icon>
            </button>
          </div>
          <p class="mt-1 text-xs tracking-wide text-zinc-400">{{ item.phonetic }}</p>
          <p class="mt-3 line-clamp-2 whitespace-pre-line text-sm leading-6 text-zinc-600">
            {{ formatText(item.definition) }}
          </p>
          <p class="mt-1 line-clamp-2 whitespace-pre-line text-sm leading-6 text-zinc-500">
            {{ formatText(item.translation) }}
          </p>
          <div class="mt-auto flex flex-wrap gap-1.5 pt-4">
            <span
              v-for="tag in wordTags(item)"
              :key="tag"
              class="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700"
            >
              {{ tag }}
            </span>
          </div>
        </article>
      </div>

      <el-empty v-if="!loading && !error && list.length === 0" description="没有找到相关单词" />
      <p v-if="error" role="status" class="mt-6 text-center text-sm text-zinc-500">
        {{ error }}
      </p>
      <el-pagination
        class="mt-10 flex justify-center"
        background
        layout="prev, pager, next"
        :pager-count="5"
        size="small"
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        @current-change="getList"
        @size-change="getList"
      />
    </template>

    <template v-else>
      <div class="mt-6 flex items-center justify-between gap-3">
        <p class="text-xs text-zinc-500">共 {{ myBooks.length }} 个自定义词库</p>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-700"
          @click="openImport"
        >
          <el-icon :size="13"><Upload /></el-icon>
          导入词库
        </button>
      </div>

      <div v-loading="myLoading" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="book in myBooks"
          :key="book.id"
          class="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 transition-all hover:border-teal-200"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="truncate text-lg font-semibold tracking-tight text-zinc-950">
                {{ book.name }}
              </h2>
              <p class="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500">
                {{ book.description || '没有描述' }}
              </p>
            </div>
            <span class="shrink-0 rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
              {{ book.wordCount }} 词
            </span>
          </div>
          <p class="mt-4 text-xs text-zinc-400">
            更新于 {{ formatDate(book.updatedAt) }}
          </p>
          <div class="mt-auto flex items-center gap-2 pt-4">
            <button
              type="button"
              class="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
              @click="openBook(book)"
            >
              查看
            </button>
            <button
              type="button"
              class="rounded-lg px-2 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
              @click="renameBook(book)"
            >
              重命名
            </button>
            <button
              type="button"
              class="ml-auto rounded-lg px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
              @click="deleteBook(book)"
            >
              删除
            </button>
          </div>
        </article>
      </div>

      <div
        v-if="!myLoading && myBooks.length === 0"
        class="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center"
      >
        <el-icon :size="30" class="text-teal-700"><Files /></el-icon>
        <p class="mt-3 text-sm font-medium text-zinc-800">还没有自定义词库</p>
        <p class="mt-1 text-xs text-zinc-500">下载模板，导入自己的单词。</p>
        <button
          type="button"
          class="btn-ink mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold"
          @click="openImport"
        >
          导入词库
        </button>
      </div>
    </template>

    <ImportDialog
      v-model="importVisible"
      type="wordbook"
      @success="onImported"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Files, Lock, Reading, Search, Upload, VideoPlay } from '@element-plus/icons-vue'
import type { Word, WordQuery, WordList } from '@en/common/word'
import type { UserWordBookSummary } from '@en/common/word-book'
import {
  getMyWordBooks,
  getWordBookList,
  removeMyWordBook,
  updateMyWordBook,
} from '@/apis/word-book'
import { useAudio } from '@/hooks/useAudio'
import { useLogin } from '@/hooks/useLogin'
import { useUserStore } from '@/stores/user'
import ImportDialog from './components/ImportDialog.vue'

const { playAudio } = useAudio({})
const { login } = useLogin()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const tabs: { value: 'public' | 'mine'; label: string }[] = [
  { value: 'public', label: '公共词库' },
  { value: 'mine', label: '我的词库' },
]
const activeTab = ref<'public' | 'mine'>('public')
const total = ref<WordList['total']>(0)
const list = ref<WordList['list']>([])
const loading = ref(false)
const error = ref('')
let requestId = 0
const query = ref<WordQuery>({
  page: 1,
  pageSize: 12,
  word: '',
  gk: false,
  zk: false,
  gre: false,
  toefl: false,
  ielts: false,
  cet6: false,
  cet4: false,
  ky: false,
})

const myBooks = ref<UserWordBookSummary[]>([])
const myLoading = ref(false)
const importVisible = ref(false)

const formatText = (text?: string) =>
  text
    ? text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\\r/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\r\n?/g, '\n')
    : ''
const wordTags = (item: Word) =>
  [
    item.gk && '高考',
    item.zk && '中考',
    item.gre && 'GRE',
    item.toefl && 'TOEFL',
    item.ielts && 'IELTS',
    item.cet6 && '六级',
    item.cet4 && '四级',
    item.ky && '考研',
  ].filter((tag): tag is string => Boolean(tag))

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const searchWord = () => {
  query.value.page = 1
  getList()
}

const getList = async () => {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const res = await getWordBookList({ ...query.value })
    if (id !== requestId) return
    if (res.success) {
      total.value = res.data.total
      list.value = res.data.list
    } else {
      error.value = res.message || '加载失败，请重新搜索'
    }
  } catch {
    if (id === requestId) error.value = '加载失败，请重新搜索'
  } finally {
    if (id === requestId) loading.value = false
  }
}

const loadMyBooks = async () => {
  myLoading.value = true
  try {
    const res = await getMyWordBooks()
    if (res.success) myBooks.value = res.data.list
  } finally {
    myLoading.value = false
  }
}

const switchTab = async (tab: 'public' | 'mine') => {
  if (tab === 'mine' && !userStore.getUser) {
    const ok = await login()
    if (!ok) return
  }
  activeTab.value = tab
  if (tab === 'mine') await loadMyBooks()
  else await getList()
}

const openImport = async () => {
  const ok = await login()
  if (!ok) return
  activeTab.value = 'mine'
  await loadMyBooks()
  importVisible.value = true
}

const onImported = async () => {
  await loadMyBooks()
}

const openBook = (book: UserWordBookSummary) => {
  router.push(`/word-book/mine/${book.id}`)
}

const renameBook = async (book: UserWordBookSummary) => {
  try {
    const result = await ElMessageBox.prompt('输入新的词库名称', '重命名词库', {
      inputValue: book.name,
      inputValidator: (value) => Boolean(value?.trim()) || '名称不能为空',
      confirmButtonText: '保存',
      cancelButtonText: '取消',
    })
    const res = await updateMyWordBook(book.id, { name: result.value.trim() })
    if (res.success) {
      ElMessage.success('已重命名')
      await loadMyBooks()
    }
  } catch {
    // 取消不处理
  }
}

const deleteBook = async (book: UserWordBookSummary) => {
  try {
    await ElMessageBox.confirm(`确定删除“${book.name}”吗？词库中的单词不会影响其他数据。`, '删除词库', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    const res = await removeMyWordBook(book.id)
    if (res.success) {
      ElMessage.success('已删除')
      await loadMyBooks()
    }
  } catch {
    // 取消不处理
  }
}

onMounted(async () => {
  if (route.query.tab === 'mine' && userStore.getUser) {
    activeTab.value = 'mine'
    await loadMyBooks()
  } else {
    await getList()
  }
  if (route.query.import === '1') await openImport()
})
onUnmounted(() => {
  requestId += 1
})
</script>
