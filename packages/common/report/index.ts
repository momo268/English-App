export interface WeeklyReportSummary {
    studyDays: number
    newWords: number
    reviewCount: number
    minutes: number
    accuracy: number
    checkInDays: number
    totalAttempts: number
}

export interface WeeklyReportDay {
    date: string
    weekday: string
    newWords: number
    reviewCount: number
    minutes: number
    totalAttempts: number
}

export interface WeeklyReportWeakWord {
    wordId: string
    word: string
    translation: string | null
    wrongCount: number
}

export interface WeeklyReportCourse {
    courseId: string
    name: string
    minutes: number
    totalAttempts: number
}

export interface WeeklyReport {
    weekStart: string
    weekEnd: string
    label: string
    year: number
    isCurrentWeek: boolean
    summary: WeeklyReportSummary
    previous: WeeklyReportSummary | null
    daily: WeeklyReportDay[]
    topWeakWords: WeeklyReportWeakWord[]
    topCourses: WeeklyReportCourse[]
    comment: string
}
