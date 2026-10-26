import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import { effectScope } from 'vue'

const require = createRequire(import.meta.url)
const ts = require('typescript')

// Run the actual hooks with controlled browser media events, including races that
// are hard to reproduce reliably by hand. No network or real learning records.
function environment() {
  const media = []
  const timers = new Map()
  const values = new Map()
  const speech = { voices: [], spoken: [], getVoices() { return this.voices },
    speak(value) { this.spoken.push(value) }, cancel() {} }
  class Audio {
    readyState = 0
    currentTime = 0
    loadCount = 0
    playCount = 0
    constructor(src) { this.src = src; media.push(this) }
    play() { this.playCount++; return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject }) }
    pause() { this.paused = true }
    removeAttribute() { this.src = '' }
    load() { this.loadCount++ }
  }
  let timerId = 0
  const globals = {
    window: { speechSynthesis: speech }, Audio,
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text } },
    DOMException,
    localStorage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    setTimeout: (callback) => { timers.set(++timerId, callback); return timerId },
    clearTimeout: (id) => timers.delete(id),
  }
  function load(file) {
    const source = readFileSync(new URL(`../src/hooks/${file}.ts`, import.meta.url), 'utf8')
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    const exports = {}
    vm.runInNewContext(code, { ...globals, exports, require })
    return exports
  }
  const scope = effectScope()
  const pronunciation = scope.run(() => load('usePronunciation').usePronunciation())
  return { media, timers, values, speech, globals, load, scope, pronunciation }
}

test('recordings use distinct accents and playback events drive the speaker state', () => {
  const env = environment()
  const p = env.pronunciation
  p.speak('style')
  assert.match(env.media[0].src, /type=2$/)
  assert.equal(p.isLoading.value, true)
  env.media[0].onplaying()
  assert.equal(p.isPlaying.value, true)
  assert.equal(p.isLoading.value, false)
  env.media[0].onended()
  assert.equal(p.isPlaying.value, false)
  p.useAccent('uk')
  p.speak('a & b')
  assert.match(env.media[1].src, /audio=a%20%26%20b&type=1$/)
  assert.equal(env.values.get('learn-accent'), 'uk')
  env.scope.stop()
})

test('old playback events and rejected promises cannot affect a newer word', async () => {
  const env = environment()
  const p = env.pronunciation
  p.speak('style')
  const oldPlaying = env.media[0].onplaying
  p.speak('focus')
  oldPlaying()
  env.media[0].reject(new Error('late network error'))
  await Promise.resolve()
  assert.equal(env.media[0].paused, true)
  assert.equal(p.isLoading.value, true)
  assert.equal(p.isPlaying.value, false)
  assert.equal(p.error.value, '')
  assert.equal(env.speech.spoken.length, 0)
  env.media[1].onplaying()
  assert.equal(p.isPlaying.value, true)
  p.stop()
  assert.equal(p.isPlaying.value, false)
  assert.equal(env.timers.size, 0)
  env.scope.stop()
})

test('autoplay blocking offers a gesture retry without silently starting a fallback', async () => {
  const env = environment()
  const p = env.pronunciation
  p.speak('style')
  env.media[0].reject(new DOMException('gesture required', 'NotAllowedError'))
  await Promise.resolve()
  assert.equal(p.needsGesture.value, true)
  assert.equal(p.isLoading.value, false)
  assert.equal(env.timers.size, 0)
  assert.equal(env.speech.spoken.length, 0)
  p.speak('style')
  env.media[0].onplaying()
  assert.equal(p.needsGesture.value, false)
  assert.equal(p.error.value, '')
  assert.equal(p.isPlaying.value, true)
  env.scope.stop()
})

test('network failure falls back only to an installed local voice of the same accent', () => {
  const env = environment()
  env.speech.voices = [
    { localService: true, lang: 'en-US' },
    { localService: false, lang: 'en-GB' },
    { localService: true, lang: 'en_GB' },
  ]
  env.pronunciation.useAccent('uk')
  env.pronunciation.speak('learn')
  env.media[0].onerror()
  assert.equal(env.speech.spoken.length, 1)
  assert.equal(env.speech.spoken[0].voice.lang, 'en_GB')
  env.speech.spoken[0].onstart()
  assert.equal(env.pronunciation.isPlaying.value, true)
  env.speech.spoken[0].onend()
  assert.equal(env.pronunciation.isPlaying.value, false)
  env.scope.stop()
})

test('missing matching voice and loading timeouts produce visible failure rather than infinite loading', () => {
  const env = environment()
  env.speech.voices = [{ localService: true, lang: 'en-US' }]
  env.pronunciation.useAccent('uk')
  env.pronunciation.speak('learn')
  ;[...env.timers.values()][0]()
  assert.equal(env.speech.spoken.length, 0)
  assert.equal(env.pronunciation.isLoading.value, false)
  assert.match(env.pronunciation.error.value, /重试/)
  assert.equal(env.timers.size, 0)
  env.scope.stop()
})

test('scope disposal cancels media and prevents late fallback', async () => {
  const env = environment()
  env.pronunciation.speak('style')
  env.scope.stop()
  env.media[0].reject(new Error('late failure'))
  await Promise.resolve()
  assert.equal(env.media[0].paused, true)
  assert.equal(env.timers.size, 0)
  assert.equal(env.speech.spoken.length, 0)
})

test('mute while AudioContext resumes cancels queued typing feedback', async () => {
  const env = environment()
  let completeResume
  let sourceCount = 0
  const contexts = []
  class AudioContext {
    state = 'suspended'
    constructor() { contexts.push(this) }
    resume() { return new Promise((resolve) => { completeResume = () => { this.state = 'running'; resolve() } }) }
    createBufferSource() { sourceCount++; throw new Error('should not create sound after mute') }
    close() { return Promise.resolve() }
  }
  env.globals.AudioContext = AudioContext
  env.globals.window.AudioContext = AudioContext
  const sounds = env.scope.run(() => env.load('useTypingSounds').useTypingSounds())
  const pending = sounds.play('key')
  sounds.setEnabled(false)
  completeResume()
  await pending
  assert.equal(contexts.length, 1)
  assert.equal(sourceCount, 0)
  assert.equal(env.values.get('learn-sound-enabled'), '0')
  env.scope.stop()
})

test('preloaded words play and replay without another media allocation or load', () => {
  const env = environment()
  const p = env.pronunciation
  p.preload(['style', 'focus'])
  p.preload(['style'])
  assert.equal(env.media.length, 2)
  assert.equal(env.media[0].playCount, 0, 'preloading must be silent')
  assert.equal(env.media[0].preload, 'auto')
  env.media[0].readyState = 4
  p.speak('style')
  assert.equal(p.isLoading.value, false, 'buffered replay must not show a loading spinner')
  env.media[0].onplaying()
  env.media[0].currentTime = 0.8
  p.stop()
  p.speak('style')
  assert.equal(env.media[0].currentTime, 0)
  assert.equal(env.media[0].loadCount, 1)
  assert.equal(env.media[0].playCount, 2)
  assert.equal(env.media.length, 2)
  p.speak('focus')
  assert.equal(env.media[1].playCount, 1)
  assert.equal(env.media[1].loadCount, 1)
  env.scope.stop()
  assert.ok(env.media.every((item) => item.src === ''), 'all cached media released on disposal')
})

test('both accents can be warmed and reused independently', () => {
  const env = environment()
  const p = env.pronunciation
  p.preload(['style'], 'us')
  p.preload(['style'], 'uk')
  env.media.forEach((item) => { item.readyState = 4 })
  p.useAccent('uk')
  p.speak('style')
  assert.equal(env.media[0].playCount, 0)
  assert.equal(env.media[1].playCount, 1)
  p.useAccent('us')
  p.speak('style')
  assert.equal(env.media[0].playCount, 1)
  assert.equal(env.media.length, 2)
  assert.ok(env.media.every((item) => item.loadCount === 1))
  env.scope.stop()
})

test('a failed preload is discarded so a click can retry the recording', () => {
  const env = environment()
  const p = env.pronunciation
  p.preload(['style'])
  env.media[0].error = { code: 2 }
  p.speak('style')
  assert.equal(env.media[0].src, '')
  assert.equal(env.media[1].playCount, 1)
  assert.equal(p.isLoading.value, true)
  env.scope.stop()
})

test('prefetch cache is bounded without evicting the currently playing recording', () => {
  const env = environment()
  const p = env.pronunciation
  p.speak('style')
  env.media[0].onplaying()
  p.preload(Array.from({ length: 20 }, (_, index) => `word-${index}`))
  assert.equal(env.media.filter((item) => item.src).length, 12)
  assert.ok(env.media[0].src.includes('style'))
  assert.equal(p.isPlaying.value, true)
  env.scope.stop()
  assert.ok(env.media.every((item) => item.src === ''))
})

test('a rejected old play attempt cannot interrupt replay of the same cached element', async () => {
  const env = environment()
  const p = env.pronunciation
  p.speak('style')
  const rejectOld = env.media[0].reject
  p.speak('style')
  env.media[0].onplaying()
  rejectOld(new DOMException('interrupted by pause', 'AbortError'))
  await Promise.resolve()
  assert.equal(env.media.length, 1)
  assert.equal(p.isPlaying.value, true)
  assert.equal(p.error.value, '')
  assert.equal(env.speech.spoken.length, 0)
  env.scope.stop()
})
