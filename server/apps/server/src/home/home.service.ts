import { Injectable } from '@nestjs/common';
import { ResponseService } from '@libs/shared';
import { LearnService } from '../learn/learn.service';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly learnService: LearnService,
    private readonly statsService: StatsService,
    private readonly response: ResponseService,
  ) {}

  async getSummary(userId: string) {
    const [goal, stats] = await Promise.all([
      this.learnService.getGoalSnapshot(userId),
      this.statsService.getSummary(userId),
    ]);

    return this.response.success({
      ...goal,
      ...stats,
    });
  }
}
