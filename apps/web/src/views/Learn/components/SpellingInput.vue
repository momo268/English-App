<template>
  <div class="mt-10 w-full max-w-2xl sm:mt-12">
    <div
      class="relative mx-auto max-w-2xl"
      @mouseenter="onHover(true)"
      @mouseleave="onHover(false)"
      @click="focus"
    >
      <div
        class="flex flex-wrap items-end justify-center gap-x-4 gap-y-4 transition-transform"
        :class="{ 'learn-shake': shaking }"
      >
        <div
          v-for="(char, index) in slots"
          :key="index"
          class="flex w-8 flex-col items-center pb-1 sm:w-10"
        >
          <span
            class="mb-2 min-h-9 text-3xl font-black leading-9 sm:text-4xl"
            :class="charClass(index)"
          >
            {{ displayChar(index) }}
          </span>
          <span
            class="h-[3px] w-full rounded-full transition-all duration-150"
            :class="barClass(index)"
          />
        </div>
      </div>

      <input
        ref="inputRef"
        :value="modelValue"
        :maxlength="expectedLength"
        type="text"
        inputmode="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        aria-label="输入单词拼写"
        class="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none"
        :disabled="disabled || status !== 'idle'"
        @input="onInput"
        @compositionstart="composing = true"
        @compositionend="onCompositionEnd"
      />
    </div>

    <div
      class="mt-7 flex min-h-6 items-center justify-center text-center text-xs"
      role="status"
    >
      <template v-if="status === 'correct'">
        <span class="font-semibold text-emerald-500">拼写正确</span>
      </template>
      <template v-else-if="status === 'revealed'">
        <span class="font-semibold text-amber-500">已显示答案，按 Enter 继续</span>
      </template>
      <template v-else-if="attempts > 0">
        <span class="text-zinc-400 dark:text-zinc-500">
          已错 {{ attempts }} 次，3 次后显示答案
        </span>
      </template>
    </div>

    <div v-if="status === 'correct' || status === 'revealed'" class="mt-7 flex justify-center">
      <button
        type="button"
        class="rounded-xl bg-zinc-900 px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        @click="$emit('next')"
      >
        下一题 <span class="ml-1 opacity-70">Enter</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import type { LearnStatus } from '@en/common/learn'
import { normalizeAnswer } from '../utils'

const props = defineProps<{
  modelValue: string
  expected: string
  status: LearnStatus
  attempts: number
  disabled: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  keystroke: [correct: boolean]
  wrong: []
  complete: []
  hover: [value: boolean]
  next: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const shaking = ref(false)
const wrong = ref(false)
const composing = ref(false)
let shakeTimer: number | undefined
let wrongTimer: number | undefined

const expectedNormalized = computed(() => normalizeAnswer(props.expected))
const expectedLength = computed(() => expectedNormalized.value.length)
const slots = computed(() => Array.from({ length: expectedLength.value }, (_, index) => index))

const activeIndex = computed(() => {
  if (props.disabled || props.status !== 'idle') return -1
  return Math.min(props.modelValue.length, expectedLength.value - 1)
})

const displayChar = (index: number) => {
  if (props.status === 'revealed') return expectedNormalized.value[index] ?? ''
  return props.modelValue[index] ?? ''
}

const charClass = (index: number) => {
  if (props.status === 'correct') return 'text-emerald-500'
  if (props.status === 'revealed') return 'text-amber-500'
  if (index < props.modelValue.length) return 'text-zinc-900 dark:text-white'
  return 'text-transparent'
}

const barClass = (index: number) => {
  if (wrong.value) return 'bg-rose-400'
  if (props.status === 'correct') return 'bg-emerald-400'
  if (props.status === 'revealed') return 'bg-amber-400'
  if (index === activeIndex.value) {
    return 'bg-teal-700 shadow-[0_2px_10px_rgba(15,118,110,0.28)] dark:bg-teal-400'
  }
  if (index < props.modelValue.length) return 'bg-zinc-400 dark:bg-zinc-500'
  return 'bg-zinc-200 dark:bg-white/10'
}

const flashWrong = () => {
  wrong.value = true
  if (wrongTimer) window.clearTimeout(wrongTimer)
  wrongTimer = window.setTimeout(() => {
    wrong.value = false
  }, 500)
}

const shake = () => {
  shaking.value = true
  if (shakeTimer) window.clearTimeout(shakeTimer)
  shakeTimer = window.setTimeout(() => {
    shaking.value = false
  }, 320)
}

const acceptValue = (value: string) => {
  if (props.disabled || props.status !== 'idle') return
  const raw = normalizeAnswer(value).slice(0, expectedLength.value)
  if (inputRef.value) inputRef.value.value = raw

  // 退格/删除：只更新，不计输入
  if (raw.length < props.modelValue.length) {
    emit('update:modelValue', raw)
    return
  }

  if (raw === props.modelValue) return

  // 正确的连续前缀
  if (expectedNormalized.value.startsWith(raw)) {
    const added = raw.slice(props.modelValue.length)
    for (let i = 0; i < added.length; i++) {
      emit('keystroke', true)
    }
    emit('update:modelValue', raw)
    if (raw.length === expectedLength.value) {
      emit('complete')
    }
    return
  }

  // 有错误字母：清空，重新输入
  if (inputRef.value) inputRef.value.value = ''
  emit('wrong')
  emit('update:modelValue', '')
  flashWrong()
  shake()
  focus()
}

const onInput = (event: Event) => {
  if (composing.value || (event as InputEvent).isComposing) return
  acceptValue((event.target as HTMLInputElement).value)
}

const onCompositionEnd = (event: CompositionEvent) => {
  composing.value = false
  // English spelling only: discard IME output instead of counting it as a wrong answer.
  const target = event.target as HTMLInputElement
  target.value = props.modelValue
}

const typeKey = (key: string) => {
  if (key === 'Backspace') acceptValue(props.modelValue.slice(0, -1))
  else if (/^[a-z]$/i.test(key)) acceptValue(props.modelValue + key)
}

const onHover = (value: boolean) => {
  emit('hover', !props.disabled && value)
}

const focus = () => {
  if (!props.disabled && props.status === 'idle') inputRef.value?.focus({ preventScroll: true })
}
const blur = () => inputRef.value?.blur()

watch(
  () => props.expected,
  () => {
    shaking.value = false
    wrong.value = false
    requestAnimationFrame(focus)
  },
)

watch(
  () => props.status,
  (value) => {
    if (value === 'idle') {
      requestAnimationFrame(focus)
    }
  },
)

onUnmounted(() => {
  window.clearTimeout(shakeTimer)
  window.clearTimeout(wrongTimer)
})
defineExpose({ focus, blur, typeKey })
</script>
