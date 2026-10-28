import { Injectable } from '@nestjs/common';
import { PrismaService } from '@libs/shared';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type {
  HeatmapData,
  MasteryBucket,
  RecentCourse,
  RecentWord,
  StatsOverview,
  StatsSummary,
  TrendPoint,
  WeakWord,
} from '@en/common/stats';

dayjs.extend(utc);

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private today() {
    return dayjs().utcOffset(8).startOf('day');
  }

  private clamp(value: number, min: number, max: number, fallback: number) {
    const parsed = Math.floor(Number(value) || fallback);
    return Math.min(max, Math.max(min, parsed));
  }

  private calculateStreak(dates: string[]) {
    const checked = new Set(dates);
    let cursor = this.today();
    if (!checked.has(cursor.format('YYYY-MM-DD'))) {
      cursor = cursor.subtract(1, 'day');
    }

    let streak = 0;
    while (checked.has(cursor.format('YYYY-MM-DD'))) {
      streak += 1;
      cursor = cursor.subtract(1, 'day');
    }
    return streak;
  }

  async getHeatmap(userId: string, weeks = 26): Promise<HeatmapData> {
    const safeWeeks = this.clamp(weeks, 1, 52, 26);
    const weekStart = this.today().startOf('week');
    const end = weekStart.add(6, 'day');
    const start = end.subtract(safeWeeks * 7 - 1, 'day');

    const logs = await this.prisma.practiceLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: start.toDate(),
          lt: end.add(1, 'day').toDate(),
        },
      },
      select: { createdAt: true, durationMs: true },
    });

    const buckets = new Map<string, { count: number; minutes: number }>();
    for (const log of logs) {
      const key = dayjs(log.createdAt).utcOffset(8).format('YYYY-MM-DD');
      const current = buckets.get(key) ?? { count: 0, minutes: 0 };
      current.count += 1;
      current.minutes += log.durationMs ?? 0;
      buckets.set(key, current);
    }

    const today = this.today();
    const days = Array.from({ length: safeWeeks * 7 }, (_, index) => {
      const cursor = start.add(index, 'day');
      const date = cursor.format('YYYY-MM-DD');
      const bucket = buckets.get(date);
      return {
        date,
        count: bucket?.count ?? 0,
        minutes: Math.round((bucket?.minutes ?? 0) / 60000),
        future: cursor.isAfter(today, 'day'),
      };
    });

    return {
      weeks: safeWeeks,
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      days,
      maxCount: Math.max(0, ...days.map(day => day.count)),
      activeDays: days.filter(day => day.count > 0).length,
      totalCount: days.reduce((sum, day) => sum + day.count, 0),
      totalMinutes: days.reduce((sum, day) => sum + day.minutes, 0),
    };
  }

  async getTrend(userId: string, days = 30): Promise<TrendPoint[]> {
    const safeDays = this.clamp(days, 7, 90, 30);
    const end = this.today();
    const start = end.subtract(safeDays - 1, 'day');

    const logs = await this.prisma.practiceLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: start.toDate(),
          lt: end.add(1, 'day').toDate(),
        },
      },
      select: {
        createdAt: true,
        mode: true,
        isCorrect: true,
        durationMs: true,
      },
    });

    const buckets = new Map<string, {
      learned: number;
      reviewed: number;
      total: number;
      correct: number;
      minutes: number;
    }>();

    for (const log of logs) {
      const key = dayjs(log.createdAt).utcOffset(8).format('YYYY-MM-DD');
      const current = buckets.get(key) ?? {
        learned: 0,
        reviewed: 0,
        total: 0,
        correct: 0,
        minutes: 0,
      };
      if (log.mode === 'review') current.reviewed += 1;
      else current.learned += 1;
      current.total += 1;
      if (log.isCorrect) current.correct += 1;
      current.minutes += log.durationMs ?? 0;
      buckets.set(key, current);
    }

    return Array.from({ length: safeDays }, (_, index) => {
      const cursor = start.add(index, 'day');
      const date = cursor.format('YYYY-MM-DD');
      const bucket = buckets.get(date);
      const total = bucket?.total ?? 0;
      return {
        date,
        learned: bucket?.learned ?? 0,
        reviewed: bucket?.reviewed ?? 0,
        total,
        correct: bucket?.correct ?? 0,
        accuracy: total > 0 ? Math.round(((bucket?.correct ?? 0) / total) * 100) : 0,
        minutes: Math.round((bucket?.minutes ?? 0) / 60000),
      };
    });
  }

  async getOverview(userId: string): Promise<StatsOverview> {
    const [totalWords, masteredWords, attempts, correct, duration, checkIns] = await Promise.all([
      this.prisma.wordBookRecord.count({ where: { userId } }),
      this.prisma.wordBookRecord.count({ where: { userId, isMaster: true } }),
      this.prisma.practiceLog.count({ where: { userId } }),
      this.prisma.practiceLog.count({ where: { userId, isCorrect: true } }),
      this.prisma.practiceLog.aggregate({
        where: { userId },
        _sum: { durationMs: true },
      }),
      this.prisma.checkIn.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'desc' },
        take: 400,
      }),
    ]);

    return {
      totalWords,
      masteredWords,
      masteredRate: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0,
      totalAttempts: attempts,
      correctAttempts: correct,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      totalMinutes: Math.round((duration._sum.durationMs ?? 0) / 60000),
      activeDays: checkIns.length,
      streak: this.calculateStreak(checkIns.map(item => item.date)),
    };
  }

  async getMastery(userId: string): Promise<MasteryBucket[]> {
    const rows = await this.prisma.wordBookRecord.groupBy({
      by: ['mastery'],
      where: { userId },
      _count: { _all: true },
    });
    const counts = new Map(rows.map(row => [row.mastery, row._count._all]));

    return Array.from({ length: 6 }, (_, level) => ({
      level,
      count: counts.get(level) ?? 0,
    }));
  }

  async getWeakWords(userId: string, limit = 8): Promise<WeakWord[]> {
    const safeLimit = this.clamp(limit, 1, 20, 8);
    const [records, courses] = await Promise.all([
      this.prisma.wordBookRecord.findMany({
        where: { userId, wrongCount: { gt: 0 } },
        include: { word: true },
        orderBy: [{ wrongCount: 'desc' }, { mastery: 'asc' }, { updatedAt: 'desc' }],
        take: safeLimit,
      }),
      this.prisma.courseRecord.findMany({
        where: { userId, isPurchased: true },
        select: {
          courseId: true,
          course: { select: { name: true, value: true } },
        },
      }),
    ]);

    return records.map(({ word, ...record }) => {
      const course = courses.find(item =>
        Boolean((word as unknown as Record<string, unknown>)[item.course.value]),
      );
      return {
        recordId: record.id,
        wordId: record.wordId,
        word: word.word,
        phonetic: word.phonetic,
        translation: word.translation,
        wrongCount: record.wrongCount,
        mastery: record.mastery,
        courseId: course?.courseId ?? null,
        courseName: course?.course.name ?? null,
      };
    });
  }

  async getRecentWords(userId: string, limit = 12): Promise<RecentWord[]> {
    const safeLimit = this.clamp(limit, 1, 40, 12);
    const logs = await this.prisma.practiceLog.findMany({
      where: { userId },
      select: {
        wordId: true,
        courseId: true,
        createdAt: true,
        mode: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(safeLimit * 5, 200),
    });

    const seen = new Set<string>();
    const picked: typeof logs = [];
    for (const log of logs) {
      const wordId = log.wordId;
      if (!wordId || seen.has(wordId)) continue;
      seen.add(wordId);
      picked.push(log);
      if (picked.length >= safeLimit) break;
    }
    if (!picked.length) return [];

    const wordIds = picked.map(log => log.wordId).filter((id): id is string => Boolean(id));
    const courseIds = Array.from(
      new Set(picked.map(log => log.courseId).filter((id): id is string => Boolean(id))),
    );
    const [words, records, courses] = await Promise.all([
      this.prisma.wordBook.findMany({
        where: { id: { in: wordIds } },
        select: {
          id: true,
          word: true,
          phonetic: true,
          translation: true,
          definition: true,
        },
      }),
      this.prisma.wordBookRecord.findMany({
        where: { userId, wordId: { in: wordIds } },
        select: { wordId: true, mastery: true, wrongCount: true },
      }),
      courseIds.length
        ? this.prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([] as { id: string; name: string }[]),
    ]);

    const wordMap = new Map(words.map(word => [word.id, word] as const));
    const recordMap = new Map(records.map(record => [record.wordId, record] as const));
    const courseMap = new Map(courses.map(course => [course.id, course] as const));

    return picked.flatMap(log => {
      const word = wordMap.get(log.wordId ?? '');
      if (!word) return [];
      const record = recordMap.get(word.id);
      const course = log.courseId ? courseMap.get(log.courseId) : undefined;
      return [{
        wordId: word.id,
        word: word.word,
        phonetic: word.phonetic,
        translation: word.translation,
        definition: word.definition,
        mastery: record?.mastery ?? 0,
        wrongCount: record?.wrongCount ?? 0,
        lastStudiedAt: log.createdAt.toISOString(),
        courseId: log.courseId,
        courseName: course?.name ?? null,
        mode: log.mode,
      }];
    });
  }

  async getRecentCourses(userId: string, limit = 3): Promise<RecentCourse[]> {
    const safeLimit = this.clamp(limit, 1, 6, 3);
    const rows = await this.prisma.courseRecord.findMany({
      where: { userId, isPurchased: true },
      include: { course: true },
      orderBy: [{ lastStudiedAt: 'desc' }, { updatedAt: 'desc' }],
      take: safeLimit,
    });

    return rows.map(row => ({
      courseId: row.courseId,
      name: row.course.name,
      lastStudiedAt: row.lastStudiedAt,
      lastWordIndex: row.lastWordIndex,
    }));
  }

  async getSummary(userId: string): Promise<StatsSummary> {
    const [overview, heatmap, trend, mastery, weakWords, recentCourses, recentWords] = await Promise.all([
      this.getOverview(userId),
      this.getHeatmap(userId, 26),
      this.getTrend(userId, 30),
      this.getMastery(userId),
      this.getWeakWords(userId, 6),
      this.getRecentCourses(userId, 3),
      this.getRecentWords(userId, 12),
    ]);

    return {
      overview,
      heatmap,
      trend,
      mastery,
      weakWords,
      recentCourses,
      recentWords,
    };
  }
}
