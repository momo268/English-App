<template>
  <div class="min-h-[70vh] bg-[#f7f6f1]">
    <div class="mx-auto w-[1200px] max-w-full px-4 pb-20 pt-8">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-teal-700"
        @click="goBack"
      >
        <el-icon><ArrowLeft /></el-icon>
        返回我的词库
      </button>

      <header class="mt-5 border-b border-zinc-200 pb-7">
        <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">
          My Wordbook
        </p>
        <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div class="min-w-0">
            <h1 class="truncate text-3xl font-semibold tracking-tight text-zinc-950">
              {{ book?.name || '我的词库' }}
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              {{ book?.description || '导入的私有词库，可搜索、查看和听发音。' }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-3 text-xs text-zinc-400">
            <span class="rounded-full bg-white px-3 py-1.5 ring-1 ring-zinc-200">
              {{ book?.wordCount ?? words.length }} 个单词
            </span>
            <span v-if="book">更新于 {{ formatDate(book.updatedAt) }}</span>
          </div>
        </div>
      </header>

      <div v-if="!userStore.getUser" class="mt-6 rounded-2xl border border-zinc-200/80 bg-white px-6 py-16 text-center">
        <div class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-teal-700">
          <el-icon :size="20"><Lock /></el-icon>
        </div>
        <p class="mt-4 text-base font-semibold text-zinc-950">登录后查看我的词库</p>
        <p class="mt-1 text-sm text-zinc-500">自定义词库只对当前账号可见。</p>
        <button
          type="button"
          class="btn-ink mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold"
          @click="handleLogin"
        >
          登录
        </button>
      </div>

      <template v-else>
        <section class="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="w-full sm:w-96">
            <el-input
              v-model="keyword"
              class="w-full"
              placeholder="搜索单词、音标、释义或例句"
              :prefix-icon="Search"
              clearable
            />
          </div>
          <p class="shrink-0 text-xs text-zinc-500">
            共 {{ words.length }} 个单词<template v-if="normalizedKeyword">，匹配 {{ filteredWords.length }} 个</template>
          </p>
        </section>

        <div
          v-loading="loading"
          class="mt-5 grid min-h-40 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <article
            v-for="item in filteredWords"
            :key="item.id"
            class="group flex min-h-[230px] flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 transition-all duration-200 hover:border-teal-200 hover:shadow-[0_20px_50px_-38px_rgba(15,118,110,0.35)]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-semibold tracking-tight text-zinc-950">{{ item.word }}</h2>
                <p class="mt-1 text-xs tracking-wide text-zinc-400">{{ item.phonetic || '暂无音标' }}</p>
              </div>
              <button
                type="button"
                aria-label="播放发音"
                class="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-teal-700 transition-colors hover:bg-teal-50"
                @click="playAudio(item.word)"
              >
                <el-icon :size="17"><VideoPlay /></el-icon>
              </button>
            </div>

            <div v-if="item.pos || item.tag" class="mt-3 flex flex-wrap gap-1.5">
              <span
                v-if="item.pos"
                class="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
              >
                {{ item.pos }}
              </span>
              <span
                v-for="tag in splitTags(item.tag)"
                :key="tag"
                class="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700"
              >
                {{ tag }}
              </span>
            </div>

            <p class="mt-3 line-clamp-2 whitespace-pre-line text-sm leading-6 text-zinc-600">
              {{ formatText(item.definition) || '暂无英文释义' }}
            </p>
            <p class="mt-1 line-clamp-2 whitespace-pre-line text-sm leading-6 text-zinc-500">
              {{ formatText(item.translation) || '暂无中文释义' }}
            </p>
            <p
              v-if="item.example"
              class="mt-3 line-clamp-2 rounded-lg bg-[#fbfaf7] px-3 py-2 text-xs italic leading-5 text-zinc-500"
            >
              {{ formatText(item.example) }}
            </p>
          </article>
        </div>

        <el-empty
          v-if="!loading && filteredWords.length === 0"
          :description="normalizedKeyword ? '没有找到相关单词' : '词库中还没有单词'"
        />
        <p v-if="error" role="status" class="mt-6 text-center text-sm text-zinc-500">{{ error }}</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Lock, Search, VideoPlay } from '@element-plus/icons-vue'
import type { UserWordBookDetail } from '@en/common/word-book'
import { getMyWordBook } from '@/apis/word-book'
import { useAudio } from '@/hooks/useAudio'
import { useLogin } from '@/hooks/useLogin'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { login } = useLogin()
const { playAudio } = useAudio({})

const book = ref<UserWordBookDetail | null>(null)
const loading = ref(false)
const error = ref('')
const keyword = ref('')

const words = computed(() => book.value?.words ?? [])
const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())
const filteredWords = computed(() => {
  if (!normalizedKeyword.value) return words.value
  return words.value.filter((item) =>
    [item.word, item.phonetic, item.translation, item.definition, item.example, item.pos, item.tag]
      .some(value => value?.toLowerCase().includes(normalizedKeyword.value)),
  )
})

const formatText = (text?: string) =>
  text
    ? text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\\r/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\r\n?/g, '\n')
    : ''

const splitTags = (tag?: string) =>
  tag
    ? tag.split(/[,;，；]/).map(item => item.trim()).filter(Boolean)
    : []

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const goBack = () => router.push('/word-book/index?tab=mine')

const load = async () => {
  if (!userStore.getUser) return
  loading.value = true
  error.value = ''
  try {
    const res = await getMyWordBook(String(route.params.id))
    if (res.success) {
      book.value = res.data
    } else {
      error.value = res.message || '词库加载失败'
    }
  } catch {
    error.value = '词库加载失败'
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  const ok = await login()
  if (!ok) return
  await load()
}

onMounted(load)
watch(() => route.params.id, load)
</script>
