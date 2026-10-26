export const formatTime = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds || 0))
    const m = Math.floor(safe / 60)
    const s = safe % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const parseLines = (text?: string | null) => {
    if (!text) return []
    return text
        .replace(/\\r/g, '')
        .replace(/\r/g, '')
        .replace(/\\n/g, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
}

export const normalizeAnswer = (value: string) => {
    return (value || '')
        .toLowerCase()
        .replace(/[^a-z]/g, '')
}

export const maskWord = (word: string) => {
    return Array.from(word)
        .map(() => '•')
        .join('')
}

export const formatTranslation = (text?: string | null) => {
    const lines = parseLines(text)
    if (!lines.length) return ''
    return lines
        .slice(0, 2)
        .join('；')
        .replace(/[；;]\s*$/g, '')
}
