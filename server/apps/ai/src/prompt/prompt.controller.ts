import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@Controller('prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) { }

  @Get('list')
  findAll() {
    return this.promptService.findAll();
  }
}
