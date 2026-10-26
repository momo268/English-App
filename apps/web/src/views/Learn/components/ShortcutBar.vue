<template>
  <div class="mt-4 hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 md:flex">
    <div
      v-for="item in shortcuts"
      :key="item.label"
      class="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500"
    >
      <kbd
        v-for="key in item.keys"
        :key="key"
        class="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
      >
        {{ key }}
      </kbd>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const shortcuts = [
  { keys: ['Enter'], label: '下一题' },
  { keys: ['Ctrl', ';'], label: '显示答案' },
  { keys: ['←', '→'], label: '上一题 / 下一题' },
  { keys: ['Space'], label: '重播发音' },
  { keys: ['Esc'], label: '暂停' },
]
</script>
