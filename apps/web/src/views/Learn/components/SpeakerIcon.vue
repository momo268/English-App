<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" :class="{ 'speaker-playing': playing }">
    <path d="M11 4 6 8H3v8h3l5 4V4Z" />
    <path class="wave wave-near" d="M15 8a6 6 0 0 1 0 8" />
    <path class="wave wave-far" d="M18 4a11 11 0 0 1 0 16" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ playing?: boolean }>()
</script>

<style scoped>
.speaker-playing .wave { animation: sound-wave 0.85s ease-in-out infinite; }
.speaker-playing .wave-far { animation-delay: 0.16s; }
@keyframes sound-wave { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .speaker-playing .wave { animation: none; } }
</style>
