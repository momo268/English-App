import { ref } from 'vue'

const isDark = ref(false)
let initialized = false

const applyTheme = (dark: boolean) => {
    isDark.value = dark
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', dark)
    }
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('learn-theme', dark ? 'dark' : 'light')
    }
}

export const useTheme = () => {
    if (!initialized && typeof window !== 'undefined') {
        const saved = localStorage.getItem('learn-theme')
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
        applyTheme(saved ? saved === 'dark' : !!prefersDark)
        initialized = true
    }

    return {
        isDark,
        toggleTheme: () => applyTheme(!isDark.value),
        setDark: (value: boolean) => applyTheme(value),
    }
}
