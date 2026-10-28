import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@libs/shared/auth/auth.guard';
import type { Request } from 'express';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @UseGuards(AuthGuard)
  @Get('summary')
  getSummary(@Req() req: Request) {
    return this.homeService.getSummary(req.user.userId);
  }
}
