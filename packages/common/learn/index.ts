import type { Word } from '../word'

export type LearnMode = 'spelling' | 'dictation' | 'recall' | 'review'
export type LearnStatus = 'idle' | 'correct' | 'wrong' | 'revealed'

export interface WordProgress {
    mastery: number
    correctCount: number
    wrongCount: number
    ease: number
    intervalDays: number
    repetitions: number
    lastReviewedAt?: string | Date | null
    nextReviewAt?: string | Date | null
    isMaster: boolean
}

export interface LearnWord extends Word {
    progress?: WordProgress | null
}

export interface LearnWordList {
    list: LearnWord[]
    lastWordIndex: number
    total: number
}

export interface LearnReviewList {
    list: LearnWord[]
    total: number
}

export interface SubmitAnswerPayload {
    wordId: string
    courseId: string
    mode: LearnMode
    answer: string
    expected: string
    isCorrect: boolean
    revealed: boolean
    durationMs: number
    index: number
    inputCount: number
    correctInput: number
    wrongInput: number
    attempts: number
}

export interface SubmitAnswerResult {
    progress: WordProgress
}

export interface FinishSessionPayload {
    courseId: string
    wordIds: string[]
    wrongWordIds: string[]
}

export interface FinishSessionResult {
    wordNumber: number
    learnedCount: number
    wrongWords: { word: string; translation: string }[]
    checkIn?: CheckInRecord | null
}

export interface FinishReviewPayload {
    courseId: string
    wordIds: string[]
    wrongWordIds: string[]
}

export interface FinishReviewResult {
    reviewedCount: number
    wordNumber: number
    learnedCount: number
    wrongWords: { word: string; translation: string }[]
    checkIn?: CheckInRecord | null
}

export interface DailyGoalConfig {
    dailyNew: number
    dailyReview: number
    dailyMinutes: number
}

export interface DailyProgress {
    date: string
    newWords: number
    reviewWords: number
    minutes: number
}

export interface CheckInRecord {
    id: string
    date: string
    words: number
    minutes: number
    createdAt?: string | Date
    updatedAt?: string | Date
}

export interface StudyGoalSummary {
    goal: DailyGoalConfig
    progress: DailyProgress
    completed: boolean
    checkIn: CheckInRecord | null
    streak: number
    wrongBookCount: number
    dueReviewCount: number
}

export interface UpdateStudyGoalsPayload {
    dailyNew: number
    dailyReview: number
    dailyMinutes: number
}

export interface CheckInCalendarDay {
    date: string
    checkedIn: boolean
    words: number
    minutes: number
}

export interface CheckInCalendar {
    month: string
    days: CheckInCalendarDay[]
    checkedInDays: number
    streak: number
}

export interface WrongBookItem extends Word {
    recordId: string
    wrongCount: number
    courseId: string | null
    courseName: string | null
    progress: WordProgress
}

export interface WrongBookList {
    list: WrongBookItem[]
    total: number
    page: number
    pageSize: number
    wrongWordCount: number
    dueCount: number
}

export interface ResultLearn {
    wordNumber: number
}
