import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WorkBookService } from './work-book.service';
import type { WordQuery } from "@en/common/word";
import type { UpdateUserWordBookPayload } from '@en/common/word-book';
import { AuthGuard } from "@libs/shared/auth/auth.guard";

@Controller('work-book')
export class WorkBookController {
  constructor(private readonly workBookService: WorkBookService) { }

  @Get()
  findAll(@Query() query: WordQuery) {
    return this.workBookService.findAll(query);
  }

  @UseGuards(AuthGuard)
  @Get('mine')
  findMyBooks(@Req() req: Request) {
    return this.workBookService.findMyBooks(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Get('mine/:id')
  findMyBook(@Req() req: Request, @Param('id') id: string) {
    return this.workBookService.findMyBook(id, req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Patch('mine/:id')
  updateMyBook(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserWordBookPayload,
  ) {
    return this.workBookService.updateMyBook(id, req.user.userId, dto);
  }

  @UseGuards(AuthGuard)
  @Delete('mine/:id')
  removeMyBook(@Req() req: Request, @Param('id') id: string) {
    return this.workBookService.removeMyBook(id, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workBookService.findOne(+id);
  }
}
