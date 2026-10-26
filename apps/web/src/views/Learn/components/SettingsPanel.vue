<template>
  <Teleport to="body">
    <Transition name="learn-fade">
      <div v-if="open" class="fixed inset-0 z-50 flex justify-end bg-zinc-950/25 backdrop-blur-sm" @click.self="$emit('close')" @keydown.stop="onKeydown">
        <aside ref="panel" role="dialog" aria-modal="true" aria-labelledby="learn-settings-title" tabindex="-1" class="h-full w-full max-w-sm overflow-y-auto border-l border-zinc-200 bg-white p-6 text-zinc-600 shadow-xl outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
          <div class="flex items-center justify-between">
            <div>
              <h2 id="learn-settings-title" class="text-lg font-semibold text-zinc-900 dark:text-white">学习设置</h2>
              <p class="mt-1 text-xs text-zinc-400">练习已暂停，安心调整偏好</p>
            </div>
            <button ref="closeButton" type="button" aria-label="关闭设置" class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10" @click="$emit('close')"><el-icon :size="18"><Close /></el-icon></button>
          </div>

          <section class="mt-8">
            <h3 class="text-xs font-semibold tracking-wide text-zinc-500">单词发音</h3>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button v-for="option in accents" :key="option.value" type="button" :aria-pressed="accent === option.value" class="rounded-xl border px-3 py-3 text-sm font-medium transition" :class="accent === option.value ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-400/50 dark:bg-teal-400/10 dark:text-teal-300' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-white/10 dark:text-zinc-400'" @click="$emit('useAccent', option.value)">
                <span class="mr-1 text-[10px] opacity-70">{{ option.code }}</span> {{ option.label }}
              </button>
            </div>
            <button type="button" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-50 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:bg-white/5 dark:text-zinc-300" :aria-busy="loading" @click="$emit('preview')">
              <SpeakerIcon :playing="playing" class="h-4 w-4" /> {{ loading ? '正在加载…' : playing ? '正在播放…' : '试听当前单词' }}
            </button>
            <p v-if="audioError" role="status" class="mt-2 text-xs leading-5 text-amber-600 dark:text-amber-400">{{ audioError }}</p>
          </section>

          <section class="mt-6">
            <label for="voice-rate" class="flex items-center justify-between text-xs font-medium text-zinc-500"><span>发音语速</span><span class="tabular-nums text-teal-700 dark:text-teal-300">{{ rate.toFixed(2) }}×</span></label>
            <input id="voice-rate" type="range" min="0.6" max="1.4" step="0.05" :value="rate" class="mt-3 w-full accent-teal-700" @input="$emit('setRate', Number(($event.target as HTMLInputElement).value))" />
            <div class="mt-1 flex justify-between text-[10px] text-zinc-400"><span>慢速</span><span>标准</span><span>快速</span></div>
          </section>

          <section class="mt-6 space-y-3 border-t border-zinc-100 pt-5 dark:border-white/10">
            <button type="button" role="switch" :aria-checked="autoPlay" class="setting-row" @click="$emit('setAutoPlay', !autoPlay)">
              <span class="text-left"><span class="block">自动发音</span><span class="mt-1 block text-[11px] font-normal text-zinc-400">切换单词、继续学习时播放</span></span>
              <span class="switch-track" :class="autoPlay ? 'bg-teal-700' : 'bg-zinc-300 dark:bg-zinc-700'"><span class="switch-thumb" :class="autoPlay ? 'translate-x-4' : ''" /></span>
            </button>
            <button type="button" role="switch" :aria-checked="soundEnabled" class="setting-row" @click="$emit('setSoundEnabled', !soundEnabled)">
              <span class="text-left"><span class="block">练习音效</span><span class="mt-1 block text-[11px] font-normal text-zinc-400">按键、拼写错误与完成反馈</span></span>
              <span class="switch-track" :class="soundEnabled ? 'bg-teal-700' : 'bg-zinc-300 dark:bg-zinc-700'"><span class="switch-thumb" :class="soundEnabled ? 'translate-x-4' : ''" /></span>
            </button>
            <div :class="{ 'opacity-40': !soundEnabled }">
              <label for="sound-volume" class="flex justify-between text-xs text-zinc-500"><span>音效音量</span><span class="tabular-nums">{{ Math.round(soundVolume * 100) }}%</span></label>
              <input id="sound-volume" type="range" min="0" max="1" step="0.05" :disabled="!soundEnabled" :value="soundVolume" class="mt-3 w-full accent-teal-700" @input="$emit('setSoundVolume', Number(($event.target as HTMLInputElement).value))" />
            </div>
          </section>

          <section class="mt-5 border-t border-zinc-100 pt-5 dark:border-white/10">
            <button type="button" role="switch" :aria-checked="isDark" class="setting-row" @click="$emit('toggleTheme')">
              <span>深色模式</span><span class="switch-track" :class="isDark ? 'bg-teal-700' : 'bg-zinc-300 dark:bg-zinc-700'"><span class="switch-thumb" :class="isDark ? 'translate-x-4' : ''" /></span>
            </button>
          </section>
          <p class="mt-8 text-[11px] leading-6 text-zinc-400">设置自动保存 · Esc 关闭面板<br>Space 重播 · Enter 下一题 · Ctrl + ; 查看答案</p>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import SpeakerIcon from './SpeakerIcon.vue'
import type { Accent } from '@/hooks/usePronunciation'

const props = defineProps<{
  open: boolean
  accent: Accent
  rate: number
  autoPlay: boolean
  isDark: boolean
  soundEnabled: boolean
  soundVolume: number
  playing: boolean
  loading: boolean
  audioError: string
}>()
const emit = defineEmits<{
  close: []
  useAccent: [accent: Accent]
  preview: []
  setRate: [rate: number]
  setAutoPlay: [value: boolean]
  setSoundEnabled: [value: boolean]
  setSoundVolume: [value: number]
  toggleTheme: []
}>()
const accents = [{ value: 'us' as const, code: 'US', label: '美音' }, { value: 'uk' as const, code: 'UK', label: '英音' }]
const panel = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let returnFocus: HTMLElement | null = null
watch(() => props.open, async (open) => {
  if (open) {
    returnFocus = document.activeElement as HTMLElement | null
    await nextTick()
    closeButton.value?.focus({ preventScroll: true })
  } else {
    await nextTick()
    if (returnFocus?.isConnected && !returnFocus.closest('[inert]')) returnFocus.focus({ preventScroll: true })
  }
})
const onKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) return
  if (event.key === 'Escape') { event.preventDefault(); emit('close'); return }
  if (event.key !== 'Tab') return
  const controls = [...(panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]') || [])]
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
</script>

<style scoped>
.setting-row { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.5rem 0; font-size: 0.875rem; font-weight: 500; color: inherit; }
.switch-track { position: relative; display: inline-flex; width: 2.25rem; height: 1.25rem; flex-shrink: 0; border-radius: 9999px; transition: background-color 0.2s; }
.switch-thumb { position: absolute; top: 0.125rem; left: 0.125rem; height: 1rem; width: 1rem; border-radius: 9999px; background: white; transition: transform 0.2s; }
</style>
