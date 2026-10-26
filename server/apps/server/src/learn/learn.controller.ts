import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { LearnService } from './learn.service';
import { AuthGuard } from "@libs/shared/auth/auth.guard"
import type { Request } from 'express'
import { FinishSessionDto, SubmitAnswerDto } from './dto/learn-session.dto';
import { UpdateStudyGoalsDto } from './dto/study-goal.dto';

@Controller('learn')
export class LearnController {
  constructor(private readonly learnService: LearnService) { }

  // 兼容旧接口
  @UseGuards(AuthGuard)
  @Post('word/master')
  saveWordMaster(@Body() { wordIds }: { wordIds: string[] }, @Req() req: Request) {
    const userId = req.user.userId
    return this.learnService.saveWordMaster(wordIds, userId);
  }

  // 每答一个词
  @UseGuards(AuthGuard)
  @Post('answer')
  submitAnswer(@Body() dto: SubmitAnswerDto, @Req() req: Request) {
    const userId = req.user.userId
    return this.learnService.submitAnswer(dto, userId);
  }

  // 本组学完
  @UseGuards(AuthGuard)
  @Post('session/finish')
  finishSession(@Body() dto: FinishSessionDto, @Req() req: Request) {
    const userId = req.user.userId
    return this.learnService.finishSession(dto, userId);
  }

  // 今日到期复习
  @UseGuards(AuthGuard)
  @Get('review/due')
  getReviewList(
    @Query('courseId') courseId: string,
    @Query('limit') limit: string,
    @Query('wordId') wordId: string | undefined,
    @Req() req: Request,
  ) {
    const userId = req.user.userId
    return this.learnService.getReviewList(courseId, userId, Number(limit) || 20, wordId);
  }

  // 复习结束（答对的词标记已学，不重置新词断点）
  @UseGuards(AuthGuard)
  @Post('review/finish')
  finishReview(@Body() dto: FinishSessionDto, @Req() req: Request) {
    const userId = req.user.userId
    return this.learnService.finishReview(dto, userId);
  }

  @UseGuards(AuthGuard)
  @Get('word/:id')
  getWOrdList(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user.userId
    return this.learnService.getWOrdList(id, userId);
  }

  // 学习计划 / 每日目标
  @UseGuards(AuthGuard)
  @Get('goals')
  getGoals(@Req() req: Request) {
    return this.learnService.getStudyGoalSummary(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Put('goals')
  updateGoals(@Body() dto: UpdateStudyGoalsDto, @Req() req: Request) {
    return this.learnService.updateStudyGoals(dto, req.user.userId);
  }

  // 打卡
  @UseGuards(AuthGuard)
  @Get('check-in/today')
  getTodayCheckIn(@Req() req: Request) {
    return this.learnService.getTodayCheckIn(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Post('check-in')
  checkIn(@Req() req: Request) {
    return this.learnService.checkInToday(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Get('check-in/calendar')
  getCheckInCalendar(@Query('month') month: string, @Req() req: Request) {
    return this.learnService.getCheckInCalendar(req.user.userId, month);
  }

  // 错词本
  @UseGuards(AuthGuard)
  @Get('wrong-book')
  getWrongBook(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Req() req: Request,
  ) {
    return this.learnService.getWrongBook(
      req.user.userId,
      Number(page) || 1,
      Number(pageSize) || 20,
    );
  }

  @UseGuards(AuthGuard)
  @Post('wrong-book/:wordId/remove')
  removeWrongWord(@Param('wordId') wordId: string, @Req() req: Request) {
    return this.learnService.removeWrongWord(wordId, req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Post('review/:recordId/reset')
  resetReview(@Param('recordId') recordId: string, @Req() req: Request) {
    return this.learnService.resetReview(recordId, req.user.userId);
  }
}
