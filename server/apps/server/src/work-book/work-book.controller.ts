import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { WorkBookService } from './work-book.service';
import type { WordQuery } from "@en/common/word";
import { AuthGuard } from "@libs/shared/auth/auth.guard";

@Controller('work-book')
export class WorkBookController {
  constructor(private readonly workBookService: WorkBookService) { }


  // @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() query: WordQuery) {
    return this.workBookService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workBookService.findOne(+id);
  }
}
