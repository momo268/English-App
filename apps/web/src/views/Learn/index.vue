<template>
  <div
    class="relative flex min-h-dvh flex-col overflow-x-clip bg-[#f8f7f3] text-zinc-900 transition-colors duration-300 dark:bg-[#0b0b0c] dark:text-zinc-100"
  >
    <div :inert="paused || settingsOpen" class="flex min-h-dvh flex-1 flex-col">
    <FocusHeader
      :title="pageTitle"
      :current="Math.min(currentIndex + 1, list.length || 1)"
      :total="list.length"
      :is-dark="isDark"
      :show-word="defaultShow"
      @back="back"
      @toggle-theme="toggleTheme"
      @open-settings="openSettings"
      @toggle-default="toggleDefault"
      @pause="pause"
    />

    <main class="relative flex flex-1 flex-col">
      <!-- 加载 -->
      <div v-if="isLoading" class="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-12 sm:px-6">
        <div class="mx-auto h-10 w-40 animate-pulse rounded-full bg-zinc-200/70 dark:bg-white/5" />
        <div class="mx-auto h-24 w-full max-w-xl animate-pulse rounded-2xl bg-zinc-200/50 dark:bg-white/5" />
      </div>

      <!-- 无单词 -->
      <div v-else-if="!list.length" class="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div class="text-5xl">{{ isReview ? '✅' : '📚' }}</div>
        <h2 class="mt-4 text-xl font-bold text-zinc-900 dark:text-white">
          {{ isReview ? '今天没有待复习的单词' : '暂无可学习的单词' }}
        </h2>
        <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {{ isReview
            ? '到期的单词已经复习完，或者还没有到复习时间，先去学点新词吧。'
            : '可能还没有购买这门课程，或者本组已经全部学完。' }}
        </p>
        <button
          type="button"
          class="mt-6 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          @click="back"
        >
          返回课程
        </button>
      </div>

      <!-- 本章总结 -->
      <div v-else-if="isFinished" class="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <SessionSummary
          :title="title"
          :accuracy="accuracy"
          :elapsed="elapsed"
          :wpm="wpm"
          :total="list.length"
          :learned-count="learnedCount"
          :wrong-words="wrongWords"
          :review-mode="isReview"
          :review-has-more="isReview && reviewTotal > list.length"
          @review-wrong="reviewWrong"
          @restart="restartSame"
          @next-chapter="nextChapter"
          @play-word="speakWord"
        />
      </div>

      <!-- 练习 -->
      <template v-else-if="currentWord">
        <div class="relative flex flex-1 flex-col">
          <button
            type="button"
            class="absolute left-2 top-[42%] hidden h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-white/5 dark:hover:text-white md:flex"
            :disabled="currentIndex === 0"
            title="上一题"
            @click="prev"
          >
            <el-icon :size="18"><ArrowLeft /></el-icon>
          </button>
          <button
            type="button"
            class="absolute right-2 top-[42%] hidden h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-white/5 dark:hover:text-white md:flex"
            :disabled="status === 'idle'"
            title="下一题"
            @click="next"
          >
            <el-icon :size="18"><ArrowRight /></el-icon>
          </button>

          <div class="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
            <WordPrompt
              :word="currentWord"
              :revealed="status === 'revealed'"
              :peeked="hovered"
              :show-word="defaultShow"
              :status="status"
              :accent="accent"
              :playing="isPlaying"
              :loading="audioLoading"
              :audio-error="audioError"
              @speak="speakCurrent"
            />

            <SpellingInput
              ref="spellingRef"
              v-model="answer"
              :expected="currentWord.word"
              :status="status"
              :attempts="attempts"
              :disabled="!canPractice"
              @keystroke="onKeystroke"
              @wrong="onWrong"
              @complete="onComplete"
              @hover="hovered = $event"
              @next="next"
            />
            <p class="mt-5 text-xs text-zinc-400 dark:text-zinc-500">直接键入即可练习 · 鼠标移至输入区可查看单词</p>
          </div>

          <div class="mx-auto w-full max-w-3xl px-4 pb-8 sm:px-6">
            <SessionStats
              :elapsed="elapsed"
              :input-count="stats.inputCount"
              :wpm="wpm"
              :correct-input="stats.correctInput"
              :accuracy="accuracy"
            />
            <ShortcutBar />
          </div>
        </div>
      </template>
    </main>
    </div>

    <PauseOverlay :paused="paused && !settingsOpen" @resume="resume" />

    <SettingsPanel
      :open="settingsOpen"
      :accent="accent"
      :rate="rate"
      :auto-play="autoPlay"
      :is-dark="isDark"
      :sound-enabled="soundEnabled"
      :sound-volume="soundVolume"
      :playing="isPlaying"
      :loading="audioLoading"
      :audio-error="audioError"
      @close="closeSettings"
      @use-accent="changeAccent"
      @preview="previewVoice"
      @set-rate="setRate"
      @set-auto-play="setAutoPlay"
      @toggle-theme="toggleTheme"
      @set-sound-enabled="setSoundEnabled"
      @set-sound-volume="setSoundVolume"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import type { LearnStatus, LearnWord } from '@en/common/learn'
import { finishReview, finishSession, getReviewDue, getWordList, submitAnswer } from '@/apis/learn'
import { useUserStore } from '@/stores/user'
import { usePronunciation } from '@/hooks/usePronunciation'
import { useTypingSounds } from '@/hooks/useTypingSounds'
import { useTheme } from '@/hooks/useTheme'
import FocusHeader from './components/FocusHeader.vue'
import WordPrompt from './components/WordPrompt.vue'
import SpellingInput from './components/SpellingInput.vue'
import SessionStats from './components/SessionStats.vue'
import SessionSummary from './components/SessionSummary.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import PauseOverlay from './components/PauseOverlay.vue'
import ShortcutBar from './components/ShortcutBar.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { isDark, toggleTheme } = useTheme()
const {
  accent,
  isPlaying,
  isLoading: audioLoading,
  error: audioError,
  needsGesture,
  rate,
  autoPlay,
  useAccent,
  setRate,
  setAutoPlay,
  preload,
  speak,
  stop: stopSpeak,
} = usePronunciation()
const { enabled: soundEnabled, volume: soundVolume, setEnabled: setSoundEnabled,
  setVolume: setSoundVolume, play: playSound, stop: stopSounds } = useTypingSounds()

const courseId = computed(() => String(route.params.courseId || ''))
const title = computed(() => {
  const raw = String(route.params.title || '单词学习')
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
})
const isReview = computed(() => route.path.startsWith('/review'))
const pageTitle = computed(() => isReview.value ? `复习 · ${title.value}` : title.value)

const list = ref<LearnWord[]>([])
const currentIndex = ref(0)
const currentWord = computed(() => list.value[currentIndex.value])
const status = ref<LearnStatus>('idle')
const answer = ref('')
const hovered = ref(false)
const defaultShow = ref(localStorage.getItem('learn-default-show') === '1')
const paused = ref(false)
const isLoading = ref(true)
const isFinished = ref(false)
const finishing = ref(false)
const settingsOpen = ref(false)
const canPractice = computed(() => !paused.value && !settingsOpen.value && !isLoading.value && !isFinished.value && !finishing.value && !!currentWord.value)
const spellingRef = ref<InstanceType<typeof SpellingInput> | null>(null)
const elapsed = ref(0)
const startedAt = ref(0)
const questionStart = ref(Date.now())
const attempts = ref(0)
const learnedCount = ref(0)
const reviewTotal = ref(0)
const wrongWords = ref<{ word: string; translation: string }[]>([])
const wrongWordIds = ref<string[]>([])
const wordInput = ref(0)
const wordCorrect = ref(0)
const wordWrong = ref(0)
const stats = reactive({
  inputCount: 0,
  correctInput: 0,
  wrongInput: 0,
})

let timer: number | undefined
let autoPlayRequest = 0
let pausedAt = 0
let resumeAfterSettings = false
let disposed = false

const clearAutoPlay = () => {
  autoPlayRequest += 1
}

const accuracy = computed(() => {
  return stats.inputCount
    ? Math.round((stats.correctInput / stats.inputCount) * 100)
    : 0
})

const wpm = computed(() => {
  if (!elapsed.value) return 0
  return Math.max(0, Math.round(stats.correctInput / 5 / (elapsed.value / 60)))
})

const startTimer = () => {
  if (timer || !startedAt.value) return
  timer = window.setInterval(() => {
    elapsed.value = Math.floor((Date.now() - startedAt.value) / 1000)
  }, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}

const beginIfNeeded = () => {
  if (!startedAt.value) {
    startedAt.value = Date.now()
  }
  elapsed.value = Math.floor((Date.now() - startedAt.value) / 1000)
  startTimer()
}

const pause = () => {
  if (paused.value || isFinished.value || finishing.value || isLoading.value || !currentWord.value) return
  if (startedAt.value) {
    elapsed.value = Math.floor((Date.now() - startedAt.value) / 1000)
  }
  paused.value = true
  pausedAt = Date.now()
  hovered.value = false
  clearAutoPlay()
  spellingRef.value?.blur()
  stopTimer()
  stopSpeak()
  stopSounds()
}

const resume = () => {
  if (!paused.value || settingsOpen.value || document.hidden) return
  paused.value = false
  const pauseDuration = pausedAt ? Date.now() - pausedAt : 0
  questionStart.value += pauseDuration
  if (startedAt.value) {
    startedAt.value += pauseDuration
    startTimer()
  }
  pausedAt = 0
  focusInput()
  if (autoPlay.value) speakCurrent()
}

const focusInput = () => {
  nextTick(() => { if (canPractice.value) spellingRef.value?.focus() })
}

const openSettings = () => {
  resumeAfterSettings = canPractice.value
  pause()
  clearAutoPlay()
  stopSpeak()
  settingsOpen.value = true
}

const closeSettings = () => {
  stopSpeak()
  settingsOpen.value = false
  if (resumeAfterSettings) resume()
  resumeAfterSettings = false
}

const previewVoice = () => speak(currentWord.value?.word || 'hello')
const changeAccent = (value: 'us' | 'uk') => { useAccent(value); previewVoice() }

const toggleDefault = () => {
  defaultShow.value = !defaultShow.value
  localStorage.setItem('learn-default-show', defaultShow.value ? '1' : '0')
}

const speakCurrent = () => {
  if (canPractice.value && currentWord.value) speak(currentWord.value.word)
}

const speakWord = (word: string) => {
  speak(word)
}

const addWrong = () => {
  if (!currentWord.value) return
  const word = currentWord.value.word
  if (!wrongWordIds.value.includes(currentWord.value.id)) {
    wrongWordIds.value.push(currentWord.value.id)
  }
  if (!wrongWords.value.some((item) => item.word === word)) {
    wrongWords.value.push({
      word,
      translation: currentWord.value.translation || '',
    })
  }
}

const resetWord = () => {
  clearAutoPlay()
  stopSpeak()
  answer.value = ''
  status.value = 'idle'
  hovered.value = false
  attempts.value = 0
  wordInput.value = 0
  wordCorrect.value = 0
  wordWrong.value = 0
  questionStart.value = Date.now()
  if (paused.value) pausedAt = Date.now()
  focusInput()
  if (canPractice.value && autoPlay.value) {
    const request = autoPlayRequest
    nextTick(() => {
      if (request === autoPlayRequest && canPractice.value && autoPlay.value) speakCurrent()
    })
  }
}

const recordAnswer = async (isCorrect: boolean, revealed: boolean) => {
  if (!currentWord.value) return
  try {
    await submitAnswer({
      wordId: currentWord.value.id,
      courseId: courseId.value,
      mode: isReview.value ? 'review' : 'spelling',
      answer: answer.value,
      expected: currentWord.value.word,
      isCorrect,
      revealed,
      durationMs: Date.now() - questionStart.value,
      index: currentIndex.value,
      inputCount: wordInput.value,
      correctInput: wordCorrect.value,
      wrongInput: wordWrong.value,
      attempts: attempts.value,
    })
  } catch (error) {
    console.error('提交答题失败', error)
  }
}

const onKeystroke = (correct: boolean) => {
  if (!canPractice.value || !correct) return
  void playSound('key')
  beginIfNeeded()
  wordInput.value += 1
  wordCorrect.value += 1
  stats.inputCount += 1
  stats.correctInput += 1
}

const onWrong = () => {
  if (!canPractice.value || status.value !== 'idle') return
  void playSound('wrong')
  beginIfNeeded()
  attempts.value += 1
  wordInput.value += 1
  wordWrong.value += 1
  stats.inputCount += 1
  stats.wrongInput += 1
  addWrong()
  if (attempts.value >= 3) {
    status.value = 'revealed'
    void recordAnswer(false, true)
  }
}

const onComplete = () => {
  if (!canPractice.value || status.value !== 'idle') return
  void playSound('complete')
  beginIfNeeded()
  status.value = 'correct'
  void recordAnswer(true, false)
}

const reveal = () => {
  if (!canPractice.value || status.value !== 'idle') return
  beginIfNeeded()
  status.value = 'revealed'
  addWrong()
  void recordAnswer(false, true)
}

const next = () => {
  if (!canPractice.value || status.value === 'idle') return
  if (currentIndex.value < list.value.length - 1) {
    currentIndex.value += 1
    return
  }
  void finish()
}

const prev = () => {
  if (!canPractice.value || currentIndex.value <= 0) return
  currentIndex.value -= 1
}

const finish = async () => {
  if (isFinished.value || finishing.value) return
  finishing.value = true
  clearAutoPlay()
  stopSpeak()
  stopTimer()
  try {
    if (isReview.value) {
      const res = await finishReview({
        courseId: courseId.value,
        wordIds: list.value.map((item) => item.id),
        wrongWordIds: wrongWordIds.value,
      })
      if (res.success) {
        learnedCount.value = res.data.learnedCount
        if (res.data.wrongWords?.length) {
          wrongWords.value = res.data.wrongWords
        }
        userStore.updateUserWordNumber(res.data.wordNumber)
      } else {
        ElMessage.error(res.message)
      }
    } else {
      const res = await finishSession({
        courseId: courseId.value,
        wordIds: list.value.map((item) => item.id),
        wrongWordIds: wrongWordIds.value,
      })
      if (res.success) {
        learnedCount.value = res.data.learnedCount
        if (res.data.wrongWords?.length) {
          wrongWords.value = res.data.wrongWords
        }
        userStore.updateUserWordNumber(res.data.wordNumber)
      } else {
        ElMessage.error(res.message)
      }
    }
  } catch (error) {
    console.error('保存学习结果失败', error)
    ElMessage.error('保存学习结果失败，请稍后重试')
  }
  finishing.value = false
  isFinished.value = true
}

const resetStats = () => {
  stopTimer()
  elapsed.value = 0
  startedAt.value = 0
  stats.inputCount = 0
  stats.correctInput = 0
  stats.wrongInput = 0
  wrongWords.value = []
  wrongWordIds.value = []
  learnedCount.value = 0
  attempts.value = 0
  wordInput.value = 0
  wordCorrect.value = 0
  wordWrong.value = 0
}

const restartSame = () => {
  resetStats()
  isFinished.value = false
  currentIndex.value = 0
  resetWord()
}

const reviewWrong = () => {
  const ids = new Set(wrongWordIds.value)
  const reviewList = list.value.filter((item) => ids.has(item.id))
  if (!reviewList.length) return
  list.value = reviewList
  resetStats()
  isFinished.value = false
  currentIndex.value = 0
  resetWord()
}

const nextChapter = async () => {
  if (isReview.value) {
    if (reviewTotal.value > list.value.length) {
      resetStats()
      isFinished.value = false
      currentIndex.value = 0
      await load()
      return
    }
    back()
    return
  }
  resetStats()
  isFinished.value = false
  currentIndex.value = 0
  await load()
}

const load = async () => {
  isLoading.value = true
  try {
    if (isReview.value) {
      const focusWordId = typeof route.query.wordId === 'string' ? route.query.wordId : undefined
      const res = await getReviewDue(courseId.value, 20, focusWordId)
      if (disposed) return
      if (!res.success) {
        ElMessage.error(res.message)
        return
      }
      list.value = res.data.list
      reviewTotal.value = res.data.total
      currentIndex.value = 0
    } else {
      const res = await getWordList(courseId.value)
      if (disposed) return
      if (!res.success) {
        ElMessage.error(res.message)
        return
      }
      list.value = res.data.list
      const maxIndex = Math.max(0, list.value.length - 1)
      currentIndex.value = Math.min(Math.max(0, res.data.lastWordIndex || 0), maxIndex)
    }
  } catch (error) {
    console.error('加载单词失败', error)
  } finally {
    if (!disposed) {
      isLoading.value = false
      if (list.value.length) resetWord()
      if (document.hidden) pause()
    }
  }
}

const back = () => {
  stopSpeak()
  router.push(isReview.value && route.query.wordId ? '/wrong-book/index' : '/courses/index')
}

const onKeydown = (event: KeyboardEvent) => {
  // Modal ownership is checked before pause/resume or any learning shortcut.
  if (settingsOpen.value || event.defaultPrevented || event.isComposing) return
  const target = event.target as HTMLElement | null
  const ownInput = target?.getAttribute('aria-label') === '输入单词拼写'
  if (target?.closest('[role="dialog"], [aria-modal="true"], .el-overlay') &&
      !target.closest('[aria-labelledby="pause-title"]')) return
  if (!ownInput && target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return
  if (paused.value) {
    if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat &&
        (/^[a-z]$/i.test(event.key) || event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault()
      event.stopPropagation()
      resume()
    }
    return
  }
  if (!canPractice.value) return

  if ((event.ctrlKey || event.metaKey) && event.key === "'") {
    event.preventDefault()
    speakCurrent()
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.key === ';') {
    event.preventDefault()
    reveal()
    return
  }
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (event.key === 'Escape') {
    event.preventDefault()
    pause()
    return
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prev()
    return
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    next()
    return
  }
  const onControl = !!target?.closest('button, a, [role="button"]')
  if (event.key === 'Enter' && status.value !== 'idle' && !onControl) {
    event.preventDefault()
    next()
    return
  }
  if (event.key === ' ' && !onControl) {
    event.preventDefault()
    speakCurrent()
    return
  }
  if (status.value === 'idle' && (/^[a-z]$/i.test(event.key) || event.key === 'Backspace')) {
    if (needsGesture.value && autoPlay.value) speakCurrent()
    if (!ownInput) {
      event.preventDefault()
      spellingRef.value?.typeKey(event.key)
      focusInput()
    }
  }
}

const handleVisibility = () => {
  if (document.hidden) handleBlur()
}

const handleBlur = () => {
  if (settingsOpen.value) resumeAfterSettings = false
  pause()
  stopSpeak()
  stopSounds()
}

// Download ahead of interaction, including the alternative accent for instant preview.
watch([currentWord, accent], () => {
  preload(list.value.slice(currentIndex.value, currentIndex.value + 3).map((word) => word.word))
  if (currentWord.value) preload([currentWord.value.word], accent.value === 'us' ? 'uk' : 'us')
})

watch(currentWord, () => resetWord())

watch(
  () => userStore.user?.id,
  (id) => {
    if (id && !list.value.length && !isLoading.value) {
      load()
    }
  },
)

onMounted(() => {
  if (isDark.value) document.documentElement.classList.add('dark')
  load()
  window.addEventListener('keydown', onKeydown, true)
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('blur', handleBlur)
})

onUnmounted(() => {
  disposed = true
  stopTimer()
  clearAutoPlay()
  stopSpeak()
  document.documentElement.classList.remove('dark')
  window.removeEventListener('keydown', onKeydown, true)
  document.removeEventListener('visibilitychange', handleVisibility)
  window.removeEventListener('blur', handleBlur)
})
</script>
