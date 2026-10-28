import type { CheckInRecord, DailyGoalConfig, DailyProgress } from '../learn'

export interface StatsOverview {
    totalWords: number
    masteredWords: number
    masteredRate: number
    totalAttempts: number
    correctAttempts: number
    accuracy: number
    totalMinutes: number
    activeDays: number
    streak: number
}

export interface HeatmapDay {
    date: string
    count: number
    minutes: number
    future: boolean
}

export interface HeatmapData {
    weeks: number
    startDate: string
    endDate: string
    days: HeatmapDay[]
    maxCount: number
    activeDays: number
    totalCount: number
    totalMinutes: number
}

export interface TrendPoint {
    date: string
    learned: number
    reviewed: number
    total: number
    correct: number
    accuracy: number
    minutes: number
}

export interface MasteryBucket {
    level: number
    count: number
}

export interface WeakWord {
    recordId: string
    wordId: string
    word: string
    phonetic: string | null
    translation: string | null
    wrongCount: number
    mastery: number
    courseId: string | null
    courseName: string | null
}

export interface RecentCourse {
    courseId: string
    name: string
    lastStudiedAt: string | Date | null
    lastWordIndex: number
}

export interface RecentWord {
    wordId: string
    word: string
    phonetic: string | null
    translation: string | null
    definition: string | null
    mastery: number
    wrongCount: number
    lastStudiedAt: string | Date
    courseId: string | null
    courseName: string | null
    mode: string
}

export interface StatsSummary {
    overview: StatsOverview
    heatmap: HeatmapData
    trend: TrendPoint[]
    mastery: MasteryBucket[]
    weakWords: WeakWord[]
    recentCourses: RecentCourse[]
    recentWords: RecentWord[]
}

export interface HomeSummary extends StatsSummary {
    goal: DailyGoalConfig
    progress: DailyProgress
    completed: boolean
    checkIn: CheckInRecord | null
    streak: number
    wrongBookCount: number
    dueReviewCount: number
}
