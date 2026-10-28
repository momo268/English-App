import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { ResponseService } from '@libs/shared'
import { AuthGuard } from '@libs/shared/auth/auth.guard'
import type { Request } from 'express'
import { ReportService } from './report.service'

@Controller('report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly response: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('weekly')
  async getWeekly(@Query('weekStart') weekStart: string, @Req() req: Request) {
    return this.response.success(
      await this.reportService.getWeeklyReport(req.user.userId, weekStart),
    )
  }
}
