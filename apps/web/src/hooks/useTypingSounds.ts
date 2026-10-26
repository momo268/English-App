import { onScopeDispose, ref } from 'vue'

type Feedback = 'key' | 'wrong' | 'complete'

// Render locally once: short mechanical click, unmistakable error buzz, single bell strike.
// Cached PCM buffers start immediately and need no network or audio-file decoding.
const createFeedbackBuffer = (context: AudioContext, kind: Feedback) => {
  const duration = kind === 'key' ? 0.065 : kind === 'wrong' ? 0.28 : 0.7
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate)
  const samples = buffer.getChannelData(0)
  const tau = Math.PI * 2
  let seed = 42
  let previousNoise = 0
  let peak = 0

  for (let index = 0; index < samples.length; index++) {
    const time = index / context.sampleRate
    let sample = 0
    if (kind === 'key') {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0
      const noise = seed / 2147483648
      const click = (noise - previousNoise) * Math.exp(-time / 0.004)
      previousNoise = noise
      const body = Math.sin(tau * 640 * time) * Math.exp(-time / 0.009)
      const snap = Math.sin(tau * 3200 * time) * Math.exp(-time / 0.003)
      sample = 0.65 * click + 0.4 * body + 0.2 * snap
    } else if (kind === 'wrong') {
      // Two short, descending buzzes stand apart from both typing and success.
      const secondPulse = time >= 0.14
      const pulseTime = secondPulse ? time - 0.14 : time
      if (pulseTime < 0.11) {
        const frequency = secondPulse ? 195 : 255
        const envelope = Math.min(1, pulseTime / 0.004, (0.11 - pulseTime) / 0.018)
        sample = envelope * (0.65 * Math.tanh(2.5 * Math.sin(tau * frequency * pulseTime))
          + 0.25 * Math.sin(tau * frequency * 1.42 * pulseTime))
      }
    } else {
      // Simultaneous partials form one bright "ding", rather than a two-note melody.
      sample = Math.sin(tau * 1568 * time) * Math.exp(-time / 0.18)
        + 0.3 * Math.sin(tau * 3136 * time) * Math.exp(-time / 0.085)
        + 0.12 * Math.sin(tau * 4390 * time) * Math.exp(-time / 0.035)
    }
    const fade = Math.min(1, time / 0.0008, (duration - time) / 0.008)
    samples[index] = sample * fade
    peak = Math.max(peak, Math.abs(samples[index]!))
  }
  const level = kind === 'key' ? 0.65 : kind === 'wrong' ? 0.9 : 0.75
  if (peak) {
    for (let index = 0; index < samples.length; index++) samples[index] = samples[index]! * level / peak
  }
  return buffer
}

export const useTypingSounds = () => {
  const enabled = ref(localStorage.getItem('learn-sound-enabled') !== '0')
  const savedVolume = Number(localStorage.getItem('learn-sound-volume') ?? 0.35)
  const volume = ref(Number.isFinite(savedVolume) ? Math.max(0, Math.min(1, savedVolume)) : 0.35)
  let context: AudioContext | undefined
  let generation = 0
  const active = new Set<AudioBufferSourceNode>()
  const buffers = new Map<Feedback, AudioBuffer>()

  const stop = () => {
    generation += 1
    for (const node of active) node.stop()
    active.clear()
  }
  const play = async (kind: Feedback) => {
    if (!enabled.value || !volume.value || !window.AudioContext) return
    const id = generation
    try {
      context ??= new AudioContext()
      if (context.state === 'suspended') await context.resume()
      if (id !== generation || context.state !== 'running') return
      let buffer = buffers.get(kind)
      if (!buffer) {
        buffer = createFeedbackBuffer(context, kind)
        buffers.set(kind, buffer)
      }
      const source = context.createBufferSource()
      const gain = context.createGain()
      source.buffer = buffer
      gain.gain.setValueAtTime(volume.value, context.currentTime)
      source.connect(gain)
      gain.connect(context.destination)
      active.add(source)
      source.onended = () => { active.delete(source); source.disconnect(); gain.disconnect() }
      source.start()
    } catch {
      // Audio feedback must never interrupt typing on unsupported devices.
    }
  }
  const setEnabled = (value: boolean) => {
    enabled.value = value
    localStorage.setItem('learn-sound-enabled', value ? '1' : '0')
    if (!value) stop()
  }
  const setVolume = (value: number) => {
    if (!Number.isFinite(value)) return
    volume.value = Math.max(0, Math.min(1, value))
    localStorage.setItem('learn-sound-volume', String(volume.value))
    if (!volume.value) stop()
  }
  onScopeDispose(() => { stop(); buffers.clear(); void context?.close() })
  return { enabled, volume, setEnabled, setVolume, play, stop }
}
