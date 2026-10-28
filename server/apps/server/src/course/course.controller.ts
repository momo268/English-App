import { Controller, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CourseService } from './course.service';
import type { UpdateUserCoursePayload } from '@en/common/course';
import { AuthGuard, OptionalAuthGuard } from '@libs/shared/auth/auth.guard';

type OptionalUserRequest = Request & { user?: { userId?: string } };

@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) { }

  @UseGuards(OptionalAuthGuard)
  @Get('list')
  findAll(@Req() req: OptionalUserRequest) {
    return this.courseService.findAll(req.user?.userId);
  }

  @UseGuards(AuthGuard)
  @Get('my')
  findMy(@Req() req: Request) {
    return this.courseService.findMy(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Patch('my/:id')
  updateMyCourse(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserCoursePayload,
  ) {
    return this.courseService.updateMyCourse(id, req.user.userId, dto);
  }

  @UseGuards(AuthGuard)
  @Delete('my/:id')
  removeMyCourse(@Req() req: Request, @Param('id') id: string) {
    return this.courseService.removeMyCourse(id, req.user.userId);
  }
}
