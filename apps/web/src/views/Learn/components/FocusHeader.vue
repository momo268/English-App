<template>
  <header
    class="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70"
  >
    <div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white"
        title="返回课程"
        @click="$emit('back')"
      >
        <el-icon :size="18"><ArrowLeft /></el-icon>
      </button>

      <div class="min-w-0">
        <div class="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {{ title }}
        </div>
        <div class="text-[11px] text-zinc-400 dark:text-zinc-500">
          第 {{ current }} / {{ total }} 个
        </div>
      </div>

      <div class="ml-2 hidden flex-1 items-center gap-2 md:flex">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-white/10">
          <div
            class="h-full rounded-full bg-teal-700 transition-all duration-300 dark:bg-teal-400"
            :style="{ width: `${percent}%` }"
          />
        </div>
        <span class="w-9 text-right text-[11px] font-medium text-zinc-400">
          {{ percent }}%
        </span>
      </div>

      <div class="ml-auto flex items-center gap-1">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl transition"
          :class="showWord
            ? 'bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300'
            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white'"
          :title="showWord ? '关闭默认模式（隐藏单词）' : '开启默认模式（一直显示单词）'"
          @click="$emit('toggleDefault')"
        >
          <el-icon :size="17">
            <Hide v-if="showWord" />
            <View v-else />
          </el-icon>
        </button>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white"
          :title="isDark ? '切换浅色' : '切换深色'"
          @click="$emit('toggleTheme')"
        >
          <el-icon :size="17">
            <Sunny v-if="isDark" />
            <Moon v-else />
          </el-icon>
        </button>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white"
          title="学习设置"
          @click="$emit('openSettings')"
        >
          <el-icon :size="17"><Setting /></el-icon>
        </button>
        <button
          type="button"
          class="ml-1 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          @click="$emit('pause')"
        >
          暂停
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, Hide, Moon, Setting, Sunny, View } from '@element-plus/icons-vue'

const props = defineProps<{
  title: string
  current: number
  total: number
  isDark: boolean
  showWord: boolean
}>()

defineEmits<{
  back: []
  toggleTheme: []
  openSettings: []
  toggleDefault: []
  pause: []
}>()

const percent = computed(() => {
  if (!props.total) return 0
  return Math.min(100, Math.round((props.current / props.total) * 100))
})
</script>
