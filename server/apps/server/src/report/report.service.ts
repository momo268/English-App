import { Injectable } from '@nestjs/common'
import { PrismaService } from '@libs/shared'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type {
  WeeklyReport,
  WeeklyReportCourse,
  WeeklyReportDay,
  WeeklyReportSummary,
  WeeklyReportWeakWord,
} from '@en/common/report'

dayjs.extend(utc)

interface WeekLog {
  createdAt: Date
  mode: string
  isCorrect: boolean
  revealed: boolean
  durationMs: number | null
  wordId: string
  courseId: string | null
}

interface WeekRecord {
  createdAt: Date
}

interface WeekCheckIn {
  date: string
}

interface WeekData {
  logs: WeekLog[]
  records: WeekRecord[]
  checkIns: WeekCheckIn[]
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  private today() {
    return dayjs().utcOffset(8).startOf('day')
  }

  private dateKey(value: Date | string) {
    return dayjs(value).utcOffset(8).format('YYYY-MM-DD')
  }

  private currentWeekStart() {
    const today = this.today()
    return today.subtract((today.day() + 6) % 7, 'day')
  }

  private resolveWeekStart(input?: string) {
    const current = this.currentWeekStart()
    const fallback = current.subtract(1, 'week')
    if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return fallback
    const parsed = dayjs(`${input}T00:00:00+08:00`)
    if (!parsed.isValid()) return fallback
    const normalized = parsed.startOf('day').subtract((parsed.day() + 6) % 7, 'day')
    const earliest = current.subtract(11, 'week')
    if (normalized.isBefore(earliest, 'day')) return earliest
    if (normalized.isAfter(current, 'day')) return current
    return normalized
  }

  private async loadWeek(userId: string, start: dayjs.Dayjs, end: dayjs.Dayjs): Promise<WeekData> {
    const [logs, records, checkIns] = await Promise.all([
      this.prisma.practiceLog.findMany({
        where: {
          userId,
          createdAt: { gte: start.toDate(), lt: end.add(1, 'day').toDate() },
        },
        select: {
          createdAt: true,
          mode: true,
          isCorrect: true,
          revealed: true,
          durationMs: true,
          wordId: true,
          courseId: true,
        },
      }),
      this.prisma.wordBookRecord.findMany({
        where: {
          userId,
          createdAt: { gte: start.toDate(), lt: end.add(1, 'day').toDate() },
        },
        select: { createdAt: true },
      }),
      this.prisma.checkIn.findMany({
        where: {
          userId,
          date: { gte: start.format('YYYY-MM-DD'), lte: end.format('YYYY-MM-DD') },
        },
        select: { date: true },
      }),
    ])
    return { logs, records, checkIns }
  }

  private summarize(data: WeekData): WeeklyReportSummary {
    const attempts = data.logs.length
    const correct = data.logs.filter(log => log.isCorrect).length
    const minutes = Math.round(
      data.logs.reduce((sum, log) => sum + (log.durationMs ?? 0), 0) / 60000,
    )
    const studyDays = new Set(data.logs.map(log => this.dateKey(log.createdAt))).size
    const checkInDays = new Set(data.checkIns.map(item => item.date)).size

    return {
      studyDays,
      newWords: data.records.length,
      reviewCount: data.logs.filter(log => log.mode === 'review').length,
      minutes,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      checkInDays,
      totalAttempts: attempts,
    }
  }

  private buildDaily(data: WeekData, start: dayjs.Dayjs): WeeklyReportDay[] {
    const records = new Map<string, number>()
    for (const record of data.records) {
      const key = this.dateKey(record.createdAt)
      records.set(key, (records.get(key) ?? 0) + 1)
    }

    const logs = new Map<string, { review: number; attempts: number; duration: number }>()
    for (const log of data.logs) {
      const key = this.dateKey(log.createdAt)
      const current = logs.get(key) ?? { review: 0, attempts: 0, duration: 0 }
      current.attempts += 1
      if (log.mode === 'review') current.review += 1
      current.duration += log.durationMs ?? 0
      logs.set(key, current)
    }

    return Array.from({ length: 7 }, (_, index) => {
      const cursor = start.add(index, 'day')
      const key = cursor.format('YYYY-MM-DD')
      const day = logs.get(key)
      return {
        date: key,
        weekday: WEEKDAYS[cursor.day()] ?? '',
        newWords: records.get(key) ?? 0,
        reviewCount: day?.review ?? 0,
        minutes: Math.round((day?.duration ?? 0) / 60000),
        totalAttempts: day?.attempts ?? 0,
      }
    })
  }

  private cleanText(value?: string | null) {
    return (value ?? '')
      .replace(/\\r\\n|\\n|\\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private async buildWeakWords(data: WeekData): Promise<WeeklyReportWeakWord[]> {
    const wrongCounts = new Map<string, number>()
    for (const log of data.logs) {
      if (!log.isCorrect || log.revealed) {
        wrongCounts.set(log.wordId, (wrongCounts.get(log.wordId) ?? 0) + 1)
      }
    }
    const ids = [...wrongCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id)
    if (ids.length === 0) return []

    const words = await this.prisma.wordBook.findMany({
      where: { id: { in: ids } },
      select: { id: true, word: true, translation: true },
    })
    const byId = new Map(words.map(word => [word.id, word]))
    return ids.flatMap(id => {
      const word = byId.get(id)
      if (!word) return []
      return [{
        wordId: id,
        word: word.word,
        translation: this.cleanText(word.translation),
        wrongCount: wrongCounts.get(id) ?? 0,
      }]
    })
  }

  private async buildCourses(data: WeekData): Promise<WeeklyReportCourse[]> {
    const stats = new Map<string, { minutes: number; attempts: number }>()
    for (const log of data.logs) {
      if (!log.courseId) continue
      const current = stats.get(log.courseId) ?? { minutes: 0, attempts: 0 }
      current.minutes += log.durationMs ?? 0
      current.attempts += 1
      stats.set(log.courseId, current)
    }
    const ids = [...stats.entries()]
      .sort((a, b) => b[1].minutes - a[1].minutes || b[1].attempts - a[1].attempts)
      .slice(0, 3)
      .map(([id]) => id)
    if (ids.length === 0) return []

    const courses = await this.prisma.course.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    })
    const byId = new Map(courses.map(course => [course.id, course]))
    return ids.flatMap(id => {
      const course = byId.get(id)
      if (!course) return []
      const stat = stats.get(id)
      return [{
        courseId: id,
        name: course.name,
        minutes: Math.round((stat?.minutes ?? 0) / 60000),
        totalAttempts: stat?.attempts ?? 0,
      }]
    })
  }

  private buildComment(summary: WeeklyReportSummary, previous: WeeklyReportSummary | null) {
    if (summary.totalAttempts === 0 && summary.newWords === 0) {
      return '本周还没有学习记录，先从一组单词开始吧。'
    }

    const sentences: string[] = []
    if (summary.studyDays >= 5) {
      sentences.push(`本周学习 ${summary.studyDays} 天，节奏保持得很稳。`)
    } else if (summary.studyDays > 0) {
      sentences.push(`本周学习 ${summary.studyDays} 天，能保持开始就已经很好。`)
    }

    if (previous && previous.minutes > 0) {
      const diff = summary.minutes - previous.minutes
      if (diff >= 5) sentences.push(`时长比上周多了 ${diff} 分钟。`)
      else if (diff <= -5) sentences.push(`时长比上周少了 ${Math.abs(diff)} 分钟，下周补一点。`)
    }

    if (summary.totalAttempts >= 10 && summary.accuracy < 65) {
      sentences.push(`正确率 ${summary.accuracy}%，建议把本周错词再过一遍。`)
    } else if (summary.reviewCount === 0 && summary.newWords > 0) {
      sentences.push('这周以新词为主，下周可以多安排一点复习。')
    } else {
      sentences.push('继续保持这个节奏，下周见。')
    }

    return sentences.slice(0, 2).join('')
  }

  async getWeeklyReport(userId: string, weekStartInput?: string): Promise<WeeklyReport> {
    const weekStart = this.resolveWeekStart(weekStartInput)
    const weekEnd = weekStart.add(6, 'day')
    const previousStart = weekStart.subtract(1, 'week')
    const previousEnd = previousStart.add(6, 'day')

    const [currentData, previousData] = await Promise.all([
      this.loadWeek(userId, weekStart, weekEnd),
      this.loadWeek(userId, previousStart, previousEnd),
    ])
    const summary = this.summarize(currentData)
    const previousSummary = this.summarize(previousData)
    const previous = previousSummary.totalAttempts === 0 && previousSummary.newWords === 0
      ? null
      : previousSummary
    const [topWeakWords, topCourses] = await Promise.all([
      this.buildWeakWords(currentData),
      this.buildCourses(currentData),
    ])

    const startLabel = weekStart.format('M月D日')
    const endLabel = weekStart.isSame(weekEnd, 'month')
      ? weekEnd.format('D日')
      : weekEnd.format('M月D日')

    return {
      weekStart: weekStart.format('YYYY-MM-DD'),
      weekEnd: weekEnd.format('YYYY-MM-DD'),
      label: `${startLabel} - ${endLabel}`,
      year: weekStart.year(),
      isCurrentWeek: weekStart.isSame(this.currentWeekStart(), 'day'),
      summary,
      previous,
      daily: this.buildDaily(currentData, weekStart),
      topWeakWords,
      topCourses,
      comment: this.buildComment(summary, previous),
    }
  }
}
