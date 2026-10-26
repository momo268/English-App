<template>
  <el-dialog v-model="isShow" title="搜索单词" width="min(640px, calc(100vw - 32px))" @opened="focusInput">
    <input
      ref="inputRef"
      v-model="search"
      aria-label="搜索单词"
      placeholder="输入单词，点击结果即可复制"
      class="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
    />
    <div class="mt-4 max-h-[50vh] overflow-y-auto" aria-live="polite">
      <p v-if="loading" class="py-6 text-center text-sm text-gray-400">正在搜索…</p>
      <p v-else-if="error" class="py-6 text-center text-sm text-gray-500">{{ error }}</p>
      <p v-else-if="search.trim() && !wordList.length" class="py-6 text-center text-sm text-gray-400">没有找到相关单词</p>
      <button
        v-for="item in wordList"
        v-else
        :key="item.id"
        type="button"
        class="block w-full rounded-xl p-3 text-left transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        @click="copyWord(item.word)"
      >
        <span class="block text-sm font-semibold text-teal-700">{{ item.word }}</span>
        <span class="mt-1 block whitespace-pre-line text-sm leading-6 text-zinc-500">{{ item.translation?.replace(/<br\s*\/?>/gi, '\n') }}</span>
      </button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { Word } from '@en/common/word'
import { getWordBookList } from '@/apis/word-book'
import { ElMessage } from 'element-plus'

const isShow = ref(false)
const search = ref('')
const wordList = ref<Word[]>([])
const loading = ref(false)
const error = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let requestId = 0

const focusInput = () => inputRef.value?.focus()

const getList = async (word: string, id: number) => {
  try {
    const res = await getWordBookList({ word, page: 1, pageSize: 20 })
    // 用户可能已经输入了新词或关闭弹窗，只接收最新一次搜索结果。
    if (id !== requestId || !isShow.value) return
    if (res.success) wordList.value = res.data.list
    else error.value = res.message || '搜索失败，请重新输入后重试'
  } catch {
    if (id === requestId && isShow.value) error.value = '搜索失败，请重新输入后重试'
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(search, (value) => {
  clearTimeout(timer)
  const id = ++requestId
  const word = value.trim()
  wordList.value = []
  error.value = ''
  loading.value = !!word && isShow.value
  if (!loading.value) return
  // 停止输入 300 毫秒后再请求，减少连续打字时的重复搜索。
  timer = setTimeout(() => { void getList(word, id) }, 300)
}, { flush: 'sync' })

watch(isShow, (open) => {
  if (open) return
  clearTimeout(timer)
  requestId += 1
  search.value = ''
  wordList.value = []
  loading.value = false
  error.value = ''
}, { flush: 'sync' })

const copyWord = async (word: string) => {
  try {
    await navigator.clipboard.writeText(word)
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败，请检查浏览器的剪贴板权限')
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.isComposing) return
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
    const target = event.target as HTMLElement | null
    if (!isShow.value && target?.closest('[role="dialog"]')) return
    event.preventDefault()
    isShow.value = true
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  clearTimeout(timer)
  requestId += 1
  window.removeEventListener('keydown', handleKeydown)
})
</script>
