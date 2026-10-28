import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ResponseService } from '@libs/shared';
import { AuthGuard } from '@libs/shared/auth/auth.guard';
import type { Request } from 'express';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly response: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('overview')
  async getOverview(@Req() req: Request) {
    return this.response.success(await this.statsService.getOverview(req.user.userId));
  }

  @UseGuards(AuthGuard)
  @Get('heatmap')
  async getHeatmap(@Query('weeks') weeks: string, @Req() req: Request) {
    return this.response.success(
      await this.statsService.getHeatmap(req.user.userId, Number(weeks) || 26),
    );
  }

  @UseGuards(AuthGuard)
  @Get('trend')
  async getTrend(@Query('days') days: string, @Req() req: Request) {
    return this.response.success(
      await this.statsService.getTrend(req.user.userId, Number(days) || 30),
    );
  }

  @UseGuards(AuthGuard)
  @Get('mastery')
  async getMastery(@Req() req: Request) {
    return this.response.success(await this.statsService.getMastery(req.user.userId));
  }

  @UseGuards(AuthGuard)
  @Get('weak-words')
  async getWeakWords(@Query('limit') limit: string, @Req() req: Request) {
    return this.response.success(
      await this.statsService.getWeakWords(req.user.userId, Number(limit) || 8),
    );
  }

  @UseGuards(AuthGuard)
  @Get('recent-courses')
  async getRecentCourses(@Req() req: Request) {
    return this.response.success(await this.statsService.getRecentCourses(req.user.userId));
  }
}
