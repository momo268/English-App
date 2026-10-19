import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WorkBookService } from './work-book.service';
import { CreateWorkBookDto } from './dto/create-work-book.dto';
import { UpdateWorkBookDto } from './dto/update-work-book.dto';
import type { WordQuery } from "@en/common/word";

@Controller('work-book')
export class WorkBookController {
  constructor(private readonly workBookService: WorkBookService) { }


  @Get()
  findAll(@Query() query: WordQuery) {
    return this.workBookService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workBookService.findOne(+id);
  }
}
