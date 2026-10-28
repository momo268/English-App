import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import type { TokenPayload } from '@en/common/user'
import { AuthGuard } from '@libs/shared/auth/auth.guard'
import type { CoachDto } from '@en/common/chat'
import { CoachService } from './coach.service'

type AuthedRequest = Request & { user: TokenPayload }

@Controller()
@UseGuards(AuthGuard)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('sessions')
  list(@Req() req: AuthedRequest) {
    return this.coachService.list(req.user.userId)
  }

  @Patch('sessions/:id')
  rename(
    @Param('id') id: string,
    @Body() body: { title: string },
    @Req() req: AuthedRequest,
  ) {
    return this.coachService.rename(id, body.title, req.user.userId)
  }

  @Delete('sessions/:id')
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.coachService.remove(id, req.user.userId)
  }

  @Get('sessions/:id/messages')
  messages(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.coachService.messages(id, req.user.userId)
  }

  @Post('coach')
  async coach(
    @Body() dto: CoachDto,
    @Req() req: AuthedRequest,
    @Res() res: Response,
  ) {
    await this.coachService.stream(dto, req.user.userId, res)
  }
}
