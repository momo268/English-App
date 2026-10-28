import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Request, Response } from 'express'
import { AuthGuard } from '@libs/shared/auth/auth.guard'
import { ResponseService } from '@libs/shared'
import type { TokenPayload } from '@en/common/user'
import type { ImportTarget } from '@en/common/import'
import { ImportService } from './import.service'

type AuthedRequest = Request & { user: TokenPayload }

@Controller('import')
export class ImportController {
  constructor(
    private readonly importService: ImportService,
    private readonly response: ResponseService,
  ) {}

  @Get('templates/:type')
  downloadTemplate(@Param('type') type: ImportTarget, @Res() res: Response) {
    const buffer = this.importService.buildTemplate(type)
    const fileName = type === 'course' ? '课程导入模板.xlsx' : '词库导入模板.xlsx'
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Content-Length': String(buffer.length),
    })
    res.send(buffer)
  }

  @Post('preview')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async preview(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: ImportTarget,
  ) {
    const preview = await this.importService.preview(file, type)
    return this.response.success(preview)
  }

  @Post('wordbook')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async importWordBook(
    @Req() req: AuthedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.importService.start(req.user.userId, file, 'wordbook', name, description)
  }

  @Post('course')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async importCourse(
    @Req() req: AuthedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.importService.start(req.user.userId, file, 'course', name, description)
  }

  @Get('jobs/:id')
  @UseGuards(AuthGuard)
  async job(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.importService.getJob(req.user.userId, id)
  }

  @Get('jobs/:id/errors')
  @UseGuards(AuthGuard)
  async errors(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const csv = await this.importService.getErrorsCsv(req.user.userId, id)
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('导入错误明细.csv')}`,
    })
    res.send(csv)
  }

  @Get('health')
  health() {
    return this.response.success({ ok: true })
  }
}
