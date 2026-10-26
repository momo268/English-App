import { onScopeDispose, ref } from 'vue'

export type Accent = 'us' | 'uk'

// Dictionary recordings keep US / UK pronunciation independent of installed system voices.
export const pronunciationUrl = (text: string, accent: Accent) =>
  `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${accent === 'uk' ? 1 : 2}`

export const usePronunciation = () => {
  const accent = ref<Accent>(localStorage.getItem('learn-accent') === 'uk' ? 'uk' : 'us')
  const savedRate = Number(localStorage.getItem('learn-voice-rate') || 1)
  const rate = ref(Number.isFinite(savedRate) ? Math.min(1.4, Math.max(0.6, savedRate)) : 1)
  const autoPlay = ref(localStorage.getItem('learn-autoplay') !== '0')
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const error = ref('')
  const needsGesture = ref(false)
  let audio: HTMLAudioElement | undefined
  let utterance: SpeechSynthesisUtterance | undefined
  let watchdog: ReturnType<typeof setTimeout> | undefined
  let requestId = 0
  const cache = new Map<string, HTMLAudioElement>()
  const cacheLimit = 12

  const release = (item: HTMLAudioElement) => {
    item.onplaying = item.onended = item.onerror = null
    item.pause()
    item.removeAttribute('src')
    item.load()
  }
  const discard = (item: HTMLAudioElement) => {
    for (const [url, cached] of cache) {
      if (cached === item) cache.delete(url)
    }
    release(item)
  }
  const getAudio = (text: string, voice: Accent) => {
    const url = pronunciationUrl(text, voice)
    let item = cache.get(url)
    if (item?.error) {
      discard(item)
      item = undefined
    }
    if (!item) {
      item = new Audio(url)
      item.preload = 'auto'
      item.load()
    }
    // Refresh LRU order, retaining the active recording while warming upcoming words.
    cache.delete(url)
    cache.set(url, item)
    for (const [key, cached] of cache) {
      if (cache.size <= cacheLimit) break
      if (cached === audio || cached === item) continue
      cache.delete(key)
      release(cached)
    }
    return item
  }
  const preload = (words: string[], voice: Accent = accent.value) => {
    for (const word of words) {
      if (word.trim()) getAudio(word, voice)
    }
  }

  const clearWatchdog = () => {
    clearTimeout(watchdog)
    watchdog = undefined
  }
  const stop = () => {
    requestId += 1
    clearWatchdog()
    if (audio) {
      audio.onplaying = audio.onended = audio.onerror = null
      audio.pause()
      // Keep the source and downloaded data so replay needs no new request.
      try { audio.currentTime = 0 } catch { /* Metadata may not be loaded yet. */ }
      audio = undefined
    }
    if (utterance) {
      utterance.onstart = utterance.onend = utterance.onerror = null
      window.speechSynthesis?.cancel()
      utterance = undefined
    }
    isPlaying.value = false
    isLoading.value = false
    needsGesture.value = false
  }
  const speak = (text: string) => {
    stop()
    error.value = ''
    if (!text.trim()) return
    const id = requestId
    isLoading.value = true
    const done = () => {
      if (id !== requestId) return
      clearWatchdog()
      isLoading.value = false
      isPlaying.value = false
    }
    const fail = () => {
      if (id !== requestId) return
      stop()
      error.value = '发音暂不可用，请检查网络后点击喇叭重试'
    }
    let usingFallback = false
    const fallback = () => {
      if (id !== requestId || usingFallback) return
      usingFallback = true
      clearWatchdog()
      if (audio) {
        discard(audio)
        audio = undefined
      }
      // Never silently substitute a different accent when a recording cannot load.
      const lang = accent.value === 'uk' ? 'en-GB' : 'en-US'
      const voice = window.speechSynthesis?.getVoices().find(
        (item) => item.localService && item.lang.replace('_', '-').toLowerCase() === lang.toLowerCase(),
      )
      if (!voice) { fail(); return }
      utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = voice
      utterance.lang = lang
      utterance.rate = rate.value
      utterance.onstart = () => {
        if (id !== requestId) return
        isLoading.value = false
        isPlaying.value = true
      }
      utterance.onend = done
      utterance.onerror = fail
      watchdog = setTimeout(fail, 15000)
      window.speechSynthesis.speak(utterance)
    }
    audio = getAudio(text, accent.value)
    try { audio.currentTime = 0 } catch { /* A cold recording starts at zero. */ }
    isLoading.value = audio.readyState < 3
    audio.playbackRate = rate.value
    audio.onplaying = () => {
      if (id !== requestId) return
      clearWatchdog()
      isLoading.value = false
      isPlaying.value = true
      watchdog = setTimeout(fail, 15000)
    }
    audio.onended = done
    audio.onerror = fallback
    watchdog = setTimeout(fallback, 5000)
    void audio.play().catch((reason: unknown) => {
      if (id !== requestId || usingFallback) return
      if (reason instanceof DOMException && reason.name === 'NotAllowedError') {
        done()
        needsGesture.value = true
        error.value = '点击喇叭或开始输入，即可播放发音'
      } else {
        fallback()
      }
    })
  }
  const useAccent = (value: Accent) => {
    stop()
    error.value = ''
    accent.value = value
    localStorage.setItem('learn-accent', value)
  }
  const setRate = (value: number) => {
    if (!Number.isFinite(value)) return
    rate.value = Math.min(1.4, Math.max(0.6, value))
    localStorage.setItem('learn-voice-rate', String(rate.value))
  }
  const setAutoPlay = (value: boolean) => {
    autoPlay.value = value
    localStorage.setItem('learn-autoplay', value ? '1' : '0')
  }
  onScopeDispose(() => {
    stop()
    for (const item of cache.values()) release(item)
    cache.clear()
  })
  return { accent, rate, autoPlay, isPlaying, isLoading, error, needsGesture, useAccent, setRate, setAutoPlay, preload, speak, stop }
}
