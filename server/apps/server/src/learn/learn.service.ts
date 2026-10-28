import { Injectable } from '@nestjs/common';
import { PrismaService, ResponseService } from '@libs/shared';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { FinishSessionDto, SubmitAnswerDto } from './dto/learn-session.dto';
import type { UpdateStudyGoalsDto } from './dto/study-goal.dto';

dayjs.extend(utc);

@Injectable()
export class LearnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseService) { }

  // 打卡统一按上海时区的自然日计算
  private todayKey() {
    return dayjs().utcOffset(8).format('YYYY-MM-DD')
  }

  private dayRange(dateKey: string) {
    const start = dayjs(`${dateKey}T00:00:00+08:00`)
    return {
      start: start.toDate(),
      end: start.add(1, 'day').toDate(),
    }
  }

  private async getGoalConfig(userId: string) {
    return this.prisma.studyGoal.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })
  }

  private async getDailyProgress(userId: string, dateKey = this.todayKey()) {
    const { start, end } = this.dayRange(dateKey)
    const [newWords, reviewWords, duration] = await Promise.all([
      this.prisma.wordBookRecord.count({
        where: { userId, createdAt: { gte: start, lt: end } },
      }),
      this.prisma.practiceLog.count({
        where: { userId, mode: 'review', createdAt: { gte: start, lt: end } },
      }),
      this.prisma.practiceLog.aggregate({
        where: { userId, createdAt: { gte: start, lt: end } },
        _sum: { durationMs: true },
      }),
    ])

    return {
      date: dateKey,
      newWords,
      reviewWords,
      minutes: Math.max(0, Math.round((duration._sum.durationMs ?? 0) / 60000)),
    }
  }

  private async getStreak(userId: string) {
    const rows = await this.prisma.checkIn.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 400,
    })
    const checked = new Set(rows.map(item => item.date))
    let cursor = dayjs().utcOffset(8).startOf('day')
    if (!checked.has(cursor.format('YYYY-MM-DD'))) {
      cursor = cursor.subtract(1, 'day')
    }

    let streak = 0
    while (checked.has(cursor.format('YYYY-MM-DD'))) {
      streak += 1
      cursor = cursor.subtract(1, 'day')
    }
    return streak
  }

  // 完成学习/复习后自动打卡；当天没有任何学习痕迹时不打卡
  private async upsertCheckIn(userId: string) {
    const progress = await this.getDailyProgress(userId)
    const words = progress.newWords + progress.reviewWords
    if (words === 0 && progress.minutes === 0) return null

    const checkIn = await this.prisma.checkIn.upsert({
      where: { userId_date: { userId, date: progress.date } },
      create: {
        userId,
        date: progress.date,
        words,
        minutes: progress.minutes,
      },
      update: {
        words,
        minutes: progress.minutes,
      },
    })
    const streak = await this.getStreak(userId)
    await this.prisma.user.update({
      where: { id: userId },
      data: { dayNumber: streak },
    })
    return checkIn
  }

  private isGoalCompleted(
    goal: { dailyNew: number; dailyReview: number; dailyMinutes: number },
    progress: { newWords: number; reviewWords: number; minutes: number },
  ) {
    return progress.newWords >= goal.dailyNew
      && progress.reviewWords >= goal.dailyReview
      && progress.minutes >= goal.dailyMinutes
  }

  // SM-2 简化：质量 1（忘记）/ 2（看过答案）/ 4（记得）/ 5（简单）
  private nextSrs(
    record: { ease: number; intervalDays: number; repetitions: number } | null,
    quality: number,
  ) {
    let ease = record?.ease ?? 2.5
    let intervalDays = record?.intervalDays ?? 0
    let repetitions = record?.repetitions ?? 0

    if (quality < 3) {
      repetitions = 0
      intervalDays = 1
    } else {
      if (repetitions === 0) intervalDays = 1
      else if (repetitions === 1) intervalDays = 6
      else intervalDays = Math.round(intervalDays * ease)
      repetitions += 1
    }

    ease = Math.min(
      3.0,
      Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))),
    )

    return {
      ease,
      intervalDays,
      repetitions,
      mastery: Math.min(5, repetitions),
      nextReviewAt: dayjs().add(intervalDays, 'day').startOf('day').toDate(),
    }
  }

  // 读取单词列表：未学完的单词（含上次没学完的），并带上 SRS 进度
  async getWOrdList(id: string, userId: string) {
    // 1.如果没有购买过课程进入页面，非法请求
    const courseRecord = await this.prisma.courseRecord.findFirst({
      where: {
        userId: userId,
        courseId: id,
        isPurchased: true,
      },
      include: {
        course: true,
      }
    })
    if (!courseRecord) {
      return this.response.error('非法请求');
    }
    const courseType = courseRecord.course.value; // gk,zk等一些分类
    const isCustom = courseRecord.course.isCustom;

    if (isCustom) {
      const courseWords = await this.prisma.courseWord.findMany({
        where: {
          courseId: id,
          word: {
            wordBookRecords: {
              none: { userId, isMaster: true },
            },
          },
        },
        include: {
          word: {
            include: {
              wordBookRecords: {
                where: { userId },
                select: {
                  mastery: true,
                  correctCount: true,
                  wrongCount: true,
                  ease: true,
                  intervalDays: true,
                  repetitions: true,
                  lastReviewedAt: true,
                  nextReviewAt: true,
                  isMaster: true,
                },
              },
            },
          },
        },
        take: 10,
        orderBy: { sortOrder: 'asc' },
      })

      const list = courseWords.map(({ word, unit }) => {
        const { wordBookRecords, ...rest } = word
        return {
          ...rest,
          unit,
          progress: wordBookRecords[0] ?? null,
        }
      })

      return this.response.success({
        list,
        lastWordIndex: courseRecord.lastWordIndex,
        total: list.length,
      })
    }

    const words = await this.prisma.wordBook.findMany({
      where: {
        [courseType]: true,
        // 只排除已经学完的单词；学习中/上次未完成的保留，断点续学才有意义
        wordBookRecords: {
          none: {
            userId: userId,
            isMaster: true,
          }
        }
      },
      include: {
        wordBookRecords: {
          where: { userId },
          select: {
            mastery: true,
            correctCount: true,
            wrongCount: true,
            ease: true,
            intervalDays: true,
            repetitions: true,
            lastReviewedAt: true,
            nextReviewAt: true,
            isMaster: true,
          }
        }
      },
      take: 10,
      orderBy: {
        frq: 'desc' // 排序-频率越高越靠前
      }
    })

    const list = words.map(({ wordBookRecords, ...word }) => ({
      ...word,
      progress: wordBookRecords[0] ?? null,
    }))

    return this.response.success({
      list,
      lastWordIndex: courseRecord.lastWordIndex,
      total: list.length,
    });
  }

  // 今日到期复习：所有 nextReviewAt <= now 的词（包括已经 isMaster 的词）
  // wordId 用于从错词本直接跳转复习：即使还没到期，也把它排到本轮第一个。
  async getReviewList(courseId: string, userId: string, limit = 20, wordId?: string) {
    const courseRecord = await this.prisma.courseRecord.findFirst({
      where: { userId, courseId, isPurchased: true },
      include: { course: true },
    })
    if (!courseRecord) {
      return this.response.error('非法请求');
    }

    const courseType = courseRecord.course.value;
    const isCustom = courseRecord.course.isCustom;
    const take = Math.min(Math.max(Math.floor(limit) || 20, 1), 50);
    const wordFilter = isCustom
      ? { courseWords: { some: { courseId } } }
      : { [courseType]: true };
    const dueWhere = {
      userId,
      nextReviewAt: { lte: new Date() },
      word: wordFilter,
    };
    const where = wordId
      ? {
          userId,
          word: wordFilter,
          OR: [{ nextReviewAt: { lte: new Date() } }, { wordId }],
        }
      : dueWhere;

    const [records, total] = await this.prisma.$transaction([
      this.prisma.wordBookRecord.findMany({
        where,
        include: { word: true },
        // 越早到期越靠前；同一天到期的错词优先
        orderBy: [{ nextReviewAt: 'asc' }, { wrongCount: 'desc' }],
        take: wordId ? take + 1 : take,
      }),
      this.prisma.wordBookRecord.count({ where: dueWhere }),
    ]);

    const ordered = wordId
      ? [
          ...records.filter(item => item.wordId === wordId),
          ...records.filter(item => item.wordId !== wordId),
        ]
      : records;
    const list = ordered.map(({ word, ...progress }) => ({
      ...word,
      progress,
    }));

    return this.response.success({ list, total });
  }

  // 每答一个词：更新 SRS + 写练习日志 + 记录断点
  async submitAnswer(dto: SubmitAnswerDto, userId: string) {
    const courseRecord = await this.prisma.courseRecord.findFirst({
      where: { userId, courseId: dto.courseId, isPurchased: true },
      select: { id: true },
    })
    if (!courseRecord) {
      return this.response.error('非法请求');
    }

    const existing = await this.prisma.wordBookRecord.findUnique({
      where: { userId_wordId: { userId, wordId: dto.wordId } },
    })

    const hadMistake = (dto.wrongInput ?? 0) > 0 || (dto.attempts ?? 0) > 0
    const quality = dto.revealed
      ? 2
      : dto.isCorrect
        ? (hadMistake ? 3 : (dto.durationMs > 0 && dto.durationMs < 2500 ? 5 : 4))
        : 1
    const srs = this.nextSrs(existing, quality)
    const correctInc = dto.isCorrect && !dto.revealed ? 1 : 0
    const wrongInc = dto.isCorrect && !dto.revealed && !hadMistake ? 0 : 1

    const progress = await this.prisma.wordBookRecord.upsert({
      where: { userId_wordId: { userId, wordId: dto.wordId } },
      create: {
        userId,
        wordId: dto.wordId,
        isMaster: false,
        ...srs,
        correctCount: correctInc,
        wrongCount: wrongInc,
        lastReviewedAt: new Date(),
      },
      update: {
        ...srs,
        // 复习时遗忘/看答案，取消“已掌握”，让它重新回到新词队列
        ...(quality < 3 ? { isMaster: false } : {}),
        correctCount: { increment: correctInc },
        wrongCount: { increment: wrongInc },
        lastReviewedAt: new Date(),
      },
      select: {
        mastery: true,
        correctCount: true,
        wrongCount: true,
        ease: true,
        intervalDays: true,
        repetitions: true,
        lastReviewedAt: true,
        nextReviewAt: true,
        isMaster: true,
      }
    })

    await this.prisma.practiceLog.create({
      data: {
        userId,
        wordId: dto.wordId,
        courseId: dto.courseId,
        mode: dto.mode,
        isCorrect: dto.isCorrect && !dto.revealed,
        revealed: dto.revealed,
        answer: dto.answer,
        expected: dto.expected,
        durationMs: dto.durationMs,
        inputCount: dto.inputCount ?? 0,
        correctInput: dto.correctInput ?? 0,
        wrongInput: dto.wrongInput ?? 0,
        attempts: dto.attempts ?? 1,
      }
    })

    await this.prisma.courseRecord.updateMany({
      where: { userId, courseId: dto.courseId },
      data: dto.mode === 'review'
        ? { lastStudiedAt: new Date() }
        : {
            lastWordIndex: dto.index,
            lastStudiedAt: new Date(),
          }
    })

    return this.response.success({ progress });
  }

  // 本组学完：标记已学、累加 wordNumber、重置断点
  async finishSession(dto: FinishSessionDto, userId: string) {
    const courseRecord = await this.prisma.courseRecord.findFirst({
      where: { userId, courseId: dto.courseId, isPurchased: true },
      select: { id: true },
    })
    if (!courseRecord) {
      return this.response.error('非法请求');
    }

    const wrongSet = new Set(dto.wrongWordIds ?? [])
    const masteredIds = dto.wordIds.filter(id => !wrongSet.has(id))
    const result = await this.markLearned(masteredIds, userId)

    const wrongWordRows = wrongSet.size
      ? await this.prisma.wordBook.findMany({
          where: { id: { in: [...wrongSet] } },
          select: { word: true, translation: true },
        })
      : []
    const wrongWords = wrongWordRows.map(item => ({
      word: item.word,
      translation: item.translation ?? '',
    }))
    await this.prisma.courseRecord.updateMany({
      where: { userId, courseId: dto.courseId },
      data: {
        lastWordIndex: 0,
        lastStudiedAt: new Date(),
      }
    })
    const checkIn = await this.upsertCheckIn(userId);

    return this.response.success({
      wordNumber: result.wordNumber,
      learnedCount: result.learnedCount,
      wrongWords,
      checkIn,
    });
  }

  // 复习结束：答对的词标记已学，答错的词留待 SRS；不改新词断点
  async finishReview(dto: FinishSessionDto, userId: string) {
    const courseRecord = await this.prisma.courseRecord.findFirst({
      where: { userId, courseId: dto.courseId, isPurchased: true },
      select: { id: true },
    })
    if (!courseRecord) {
      return this.response.error('非法请求');
    }

    const wrongSet = new Set(dto.wrongWordIds ?? [])
    const masteredIds = dto.wordIds.filter(id => !wrongSet.has(id))
    // 复习正确的词才算真正学完；答错的词保持未掌握，等 SRS 再次到期
    const result = await this.markLearned(masteredIds, userId)
    const wrongWordRows = wrongSet.size
      ? await this.prisma.wordBook.findMany({
          where: { id: { in: [...wrongSet] } },
          select: { word: true, translation: true },
        })
      : []
    const wrongWords = wrongWordRows.map(item => ({
      word: item.word,
      translation: item.translation ?? '',
    }))

    await this.prisma.courseRecord.updateMany({
      where: { userId, courseId: dto.courseId },
      data: { lastStudiedAt: new Date() },
    })
    const checkIn = await this.upsertCheckIn(userId);

    return this.response.success({
      reviewedCount: new Set(dto.wordIds).size,
      wordNumber: result.wordNumber,
      learnedCount: result.learnedCount,
      wrongWords,
      checkIn,
    });
  }

  private async markLearned(wordIds: string[], userId: string) {
    const unique = [...new Set(wordIds)]
    if (unique.length === 0) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } })
      return { wordNumber: user?.wordNumber ?? 0, learnedCount: 0 }
    }

    const existing = await this.prisma.wordBookRecord.findMany({
      where: { userId, wordId: { in: unique } },
      select: { wordId: true, isMaster: true },
    })
    const mastered = new Set(existing.filter(item => item.isMaster).map(item => item.wordId))
    const learnedCount = unique.filter(id => !mastered.has(id)).length

    await this.prisma.$transaction(
      unique.map(wordId => this.prisma.wordBookRecord.upsert({
        where: { userId_wordId: { userId, wordId } },
        create: { userId, wordId, isMaster: true },
        update: { isMaster: true },
      }))
    )

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        wordNumber: {
          increment: learnedCount,
        }
      }
    })

    return { wordNumber: user.wordNumber, learnedCount }
  }

  // 兼容旧接口：只传 wordIds
  async saveWordMaster(wordIds: string[], userId: string) {
    const result = await this.markLearned(wordIds, userId)
    return this.response.success({
      wordNumber: result.wordNumber,
    });
  }

  // 学习计划：目标 + 今日进度 + 打卡 + 待复习/错词概览
  async getGoalSnapshot(userId: string) {
    const date = this.todayKey();
    const [goal, progress, checkIn, streak, wrongBookCount, dueReviewCount] = await Promise.all([
      this.getGoalConfig(userId),
      this.getDailyProgress(userId, date),
      this.prisma.checkIn.findUnique({ where: { userId_date: { userId, date } } }),
      this.getStreak(userId),
      this.prisma.wordBookRecord.count({ where: { userId, wrongCount: { gt: 0 } } }),
      this.prisma.wordBookRecord.count({
        where: { userId, nextReviewAt: { lte: new Date() } },
      }),
    ]);

    return {
      goal: {
        dailyNew: goal.dailyNew,
        dailyReview: goal.dailyReview,
        dailyMinutes: goal.dailyMinutes,
      },
      progress,
      completed: this.isGoalCompleted(goal, progress),
      checkIn,
      streak,
      wrongBookCount,
      dueReviewCount,
    };
  }

  async getStudyGoalSummary(userId: string) {
    return this.response.success(await this.getGoalSnapshot(userId));
  }

  async updateStudyGoals(dto: UpdateStudyGoalsDto, userId: string) {
    const clean = (value: number, max: number) =>
      Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));
    const data = {
      dailyNew: clean(dto.dailyNew, 100),
      dailyReview: clean(dto.dailyReview, 200),
      dailyMinutes: clean(dto.dailyMinutes, 300),
    };

    await this.prisma.studyGoal.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return this.getStudyGoalSummary(userId);
  }

  async getTodayCheckIn(userId: string) {
    const date = this.todayKey();
    const [goal, progress, checkIn, streak] = await Promise.all([
      this.getGoalConfig(userId),
      this.getDailyProgress(userId, date),
      this.prisma.checkIn.findUnique({ where: { userId_date: { userId, date } } }),
      this.getStreak(userId),
    ]);

    return this.response.success({
      checkIn,
      streak,
      progress,
      completed: this.isGoalCompleted(goal, progress),
    });
  }

  // 手动打卡：今天至少有学习记录才允许
  async checkInToday(userId: string) {
    const progress = await this.getDailyProgress(userId);
    if (progress.newWords + progress.reviewWords === 0 && progress.minutes === 0) {
      return this.response.error('今天还没有学习记录，先学几个词吧');
    }

    const checkIn = await this.upsertCheckIn(userId);
    return this.response.success({
      checkIn,
      streak: await this.getStreak(userId),
      progress,
    });
  }

  async getCheckInCalendar(userId: string, month?: string) {
    const currentMonth = this.todayKey().slice(0, 7);
    const target = /^\d{4}-\d{2}$/.test(month ?? '') ? month! : currentMonth;
    const start = dayjs(`${target}-01T00:00:00+08:00`);
    if (!start.isValid() || start.format('YYYY-MM') !== target) {
      return this.response.error('月份格式不正确');
    }

    const end = start.add(1, 'month');
    const [rows, streak] = await Promise.all([
      this.prisma.checkIn.findMany({
        where: {
          userId,
          date: { gte: start.format('YYYY-MM-DD'), lt: end.format('YYYY-MM-DD') },
        },
      }),
      this.getStreak(userId),
    ]);
    const checked = new Map(rows.map(item => [item.date, item]));
    const days = Array.from({ length: start.daysInMonth() }, (_, index) => {
      const date = `${target}-${String(index + 1).padStart(2, '0')}`;
      const record = checked.get(date);
      return {
        date,
        checkedIn: Boolean(record),
        words: record?.words ?? 0,
        minutes: record?.minutes ?? 0,
      };
    });

    return this.response.success({
      month: target,
      days,
      checkedInDays: rows.length,
      streak,
    });
  }

  // 错词本：wrongCount > 0 的词，并映射回可复习的课程
  async getWrongBook(userId: string, page = 1, pageSize = 20) {
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safeSize = Math.min(50, Math.max(1, Math.floor(Number(pageSize) || 20)));
    const where = { userId, wrongCount: { gt: 0 } };

    const [records, total, dueCount, courseRows, customRows] = await Promise.all([
      this.prisma.wordBookRecord.findMany({
        where,
        include: { word: true },
        orderBy: [{ wrongCount: 'desc' }, { updatedAt: 'desc' }],
        skip: (safePage - 1) * safeSize,
        take: safeSize,
      }),
      this.prisma.wordBookRecord.count({ where }),
      this.prisma.wordBookRecord.count({
        where: { ...where, nextReviewAt: { lte: new Date() } },
      }),
      this.prisma.courseRecord.findMany({
        where: { userId, isPurchased: true },
        select: {
          courseId: true,
          course: { select: { name: true, value: true } },
        },
      }),
      this.prisma.courseWord.findMany({
        where: {
          course: { ownerId: userId, isCustom: true },
          word: {
            wordBookRecords: {
              some: { userId, wrongCount: { gt: 0 } },
            },
          },
        },
        select: {
          wordId: true,
          courseId: true,
          course: { select: { name: true } },
        },
      }),
    ]);

    const list = records.map(({ word, ...progress }) => {
      const custom = customRows.find(item => item.wordId === word.id);
      const course = custom
        ? { courseId: custom.courseId, course: { name: custom.course.name } }
        : courseRows.find(item =>
            Boolean((word as unknown as Record<string, unknown>)[item.course.value]),
          );
      return {
        ...word,
        recordId: progress.id,
        wrongCount: progress.wrongCount,
        courseId: course?.courseId ?? null,
        courseName: course?.course.name ?? null,
        progress: {
          mastery: progress.mastery,
          correctCount: progress.correctCount,
          wrongCount: progress.wrongCount,
          ease: progress.ease,
          intervalDays: progress.intervalDays,
          repetitions: progress.repetitions,
          lastReviewedAt: progress.lastReviewedAt,
          nextReviewAt: progress.nextReviewAt,
          isMaster: progress.isMaster,
        },
      };
    });

    return this.response.success({
      list,
      total,
      page: safePage,
      pageSize: safeSize,
      wrongWordCount: total,
      dueCount,
    });
  }

  async removeWrongWord(wordId: string, userId: string) {
    const result = await this.prisma.wordBookRecord.updateMany({
      where: { userId, wordId },
      data: { wrongCount: 0 },
    });
    return this.response.success({ removed: result.count > 0 });
  }

  // 重置某个词的 SRS，让它重新从 1 天间隔开始
  async resetReview(recordId: string, userId: string) {
    const record = await this.prisma.wordBookRecord.findFirst({
      where: { id: recordId, userId },
      select: { id: true },
    });
    if (!record) return this.response.error('记录不存在');

    await this.prisma.wordBookRecord.update({
      where: { id: record.id },
      data: {
        mastery: 0,
        ease: 2.5,
        intervalDays: 1,
        repetitions: 0,
        nextReviewAt: dayjs().add(1, 'day').startOf('day').toDate(),
        isMaster: false,
      },
    });

    return this.response.success({ reset: true });
  }
}
