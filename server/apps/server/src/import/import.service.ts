import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService, ResponseService } from '@libs/shared'
import type { Prisma } from '@libs/shared/generated/prisma/client'
import * as XLSX from 'xlsx'
import type {
  ImportJob,
  ImportIssue,
  ImportPreview,
  ImportPreviewRow,
  ImportTarget,
} from '@en/common/import'

type RawRow = ImportPreviewRow

type ParsedImport = {
  total: number
  valid: number
  duplicates: number
  errors: ImportIssue[]
  headers: string[]
  rows: RawRow[]
}

const HEADER_ALIASES: Record<keyof Omit<RawRow, 'row'>, string[]> = {
  word: ['单词', 'word', 'vocabulary', '英文'],
  phonetic: ['音标', 'phonetic', 'ipa'],
  translation: ['中文释义', '释义', '翻译', '中文', 'translation', 'meaning'],
  definition: ['英文释义', '定义', '英文解释', 'definition'],
  pos: ['词性', 'pos', 'part of speech'],
  example: ['例句', 'example', 'sentence'],
  tags: ['标签', 'tags', 'tag'],
  unit: ['单元/章节', '单元', '章节', 'unit', 'chapter'],
  sortOrder: ['排序', 'sortorder', 'sort', 'order', '序号'],
}

const MAX_ROWS = 5000
const MAX_FILE_SIZE = 5 * 1024 * 1024

@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseService,
  ) {}

  async preview(file: Express.Multer.File, type: ImportTarget): Promise<ImportPreview> {
    this.assertType(type)
    const parsed = this.parseFile(file, type)
    return {
      type,
      total: parsed.total,
      valid: parsed.valid,
      duplicates: parsed.duplicates,
      errors: parsed.errors.slice(0, 50),
      headers: parsed.headers.slice(0, 10),
      rows: parsed.rows.slice(0, 10),
    }
  }

  async start(
    userId: string,
    file: Express.Multer.File,
    type: ImportTarget,
    name: string,
    description?: string,
  ) {
    this.assertType(type)
    if (!name?.trim()) throw new BadRequestException('请填写名称')
    const parsed = this.parseFile(file, type)
    if (!parsed.rows.length) {
      throw new BadRequestException('没有可导入的有效单词')
    }

    const job = await this.prisma.importJob.create({
      data: {
        userId,
        type,
        fileName: file.originalname,
        total: parsed.total,
        failed: parsed.total - parsed.valid,
        errors: parsed.errors as unknown as Prisma.InputJsonValue,
        payload: {
          name: name.trim(),
          description: description?.trim() || null,
          rows: parsed.rows,
          errors: parsed.errors,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    // 解析已完成，入库异步执行，前端通过 job 轮询进度。
    void this.processJob(job.id)

    return this.response.success({ jobId: job.id })
  }

  async getJob(userId: string, jobId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, userId },
    })
    if (!job) throw new NotFoundException('导入任务不存在')
    return this.response.success(this.toJob(job))
  }

  async getErrorsCsv(userId: string, jobId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, userId },
    })
    if (!job) throw new NotFoundException('导入任务不存在')
    const issues = (job.errors as unknown as ImportIssue[] | null) ?? []
    const lines = ['行号,原因', ...issues.map((item) => `${item.row},"${String(item.message).replace(/"/g, '""')}"`)]
    return '\uFEFF' + lines.join('\n')
  }

  buildTemplate(type: ImportTarget) {
    this.assertType(type)
    const headers =
      type === 'course'
        ? ['单词', '音标', '中文释义', '英文释义', '词性', '例句', '标签', '单元/章节', '排序']
        : ['单词', '音标', '中文释义', '英文释义', '词性', '例句', '标签']
    const samples =
      type === 'course'
        ? [
            ['abandon', '/əˈbændən/', '放弃；抛弃', 'to leave somebody/something', 'v.', 'They abandoned the plan.', '核心词', 'Unit 1', 1],
            ['ability', '/əˈbɪləti/', '能力；才能', 'the fact of being able to do something', 'n.', 'She has the ability to learn fast.', '核心词', 'Unit 1', 2],
          ]
        : [
            ['abandon', '/əˈbændən/', '放弃；抛弃', 'to leave somebody/something', 'v.', 'They abandoned the plan.', '写作,高频'],
            ['ability', '/əˈbɪləti/', '能力；才能', 'the fact of being able to do something', 'n.', 'She has the ability to learn fast.', '口语'],
          ]

    const workbook = XLSX.utils.book_new()
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...samples])
    sheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, header.length * 2 + 4) }))
    XLSX.utils.book_append_sheet(workbook, sheet, '词条')

    const instructions = XLSX.utils.aoa_to_sheet([
      ['填写说明'],
      ['1. 只有“单词”必填，其余列可以留空。'],
      ['2. 支持 .xlsx 和 .csv，文件不超过 5MB，最多 5000 行。'],
      ['3. 同一文件内单词重复会被跳过，并在导入结果中列出。'],
      ['4. 标签多个用逗号分隔；课程模板的“单元/章节”和“排序”可选。'],
      ['5. CSV 请使用 UTF-8 编码，避免中文乱码。'],
    ])
    instructions['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(workbook, instructions, '填写说明')
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  }

  private parseFile(file: Express.Multer.File | undefined, type: ImportTarget): ParsedImport {
    if (!file) throw new BadRequestException('请上传文件')
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('文件不能超过 5MB')
    const extension = file.originalname.split('.').pop()?.toLowerCase()
    if (!extension || !['xlsx', 'xls', 'csv'].includes(extension)) {
      throw new BadRequestException('只支持 .xlsx、.xls、.csv 文件')
    }

    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: false })
    } catch {
      throw new BadRequestException('文件解析失败，请检查文件格式')
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) throw new BadRequestException('文件中没有工作表')

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    if (!matrix.length) throw new BadRequestException('文件内容为空')
    const headers = (matrix[0] ?? []).map((item) => String(item ?? '').trim())
    const indexByField = Object.fromEntries(
      Object.entries(HEADER_ALIASES).map(([field, aliases]) => [
        field,
        headers.findIndex((header) => {
          const normalized = this.normalizeHeader(header)
          return aliases.some((alias) => this.normalizeHeader(alias) === normalized)
        }),
      ]),
    ) as Record<keyof Omit<RawRow, 'row'>, number>

    if (indexByField.word < 0) {
      throw new BadRequestException('模板缺少“单词”列')
    }

    const rows: RawRow[] = []
    const errors: ImportIssue[] = []
    let duplicates = 0
    const seen = new Set<string>()
    const dataRows = matrix.slice(1)

    if (dataRows.length > MAX_ROWS) {
      throw new BadRequestException(`最多导入 ${MAX_ROWS} 行`)
    }

    dataRows.forEach((values, index) => {
      const rowNumber = index + 2
      const value = (field: keyof Omit<RawRow, 'row'>) => {
        const column = indexByField[field]
        return column >= 0 ? String((values as unknown[])[column] ?? '').trim() : ''
      }
      const word = value('word')
      if (!word) return
      const key = word.toLowerCase()
      if (seen.has(key)) {
        duplicates += 1
        errors.push({ row: rowNumber, message: `单词“${word}”在本文件中重复` })
        return
      }
      seen.add(key)
      const sortOrderRaw = value('sortOrder')
      const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : null
      rows.push({
        row: rowNumber,
        word,
        phonetic: value('phonetic'),
        translation: value('translation'),
        definition: value('definition'),
        pos: value('pos'),
        example: value('example'),
        tags: value('tags'),
        unit: value('unit'),
        sortOrder: sortOrder !== null && Number.isFinite(sortOrder) ? sortOrder : null,
      })
    })

    return {
      total: dataRows.filter((row) => String((row as unknown[])[indexByField.word] ?? '').trim()).length,
      valid: rows.length,
      duplicates,
      errors,
      headers,
      rows,
    }
  }

  private async processJob(jobId: string) {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } })
    if (!job) return
    const payload = job.payload as unknown as {
      name: string
      description: string | null
      rows: RawRow[]
      errors: ImportIssue[]
    } | null
    if (!payload) {
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'failed', message: '导入数据为空' },
      })
      return
    }

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'importing' },
    })

    let targetId: string | null = null
    let success = 0
    const errors = [...(payload.errors ?? [])]

    try {
      if (job.type === 'wordbook') {
        const book = await this.prisma.userWordBook.create({
          data: {
            userId: job.userId,
            name: payload.name,
            description: payload.description,
          },
        })
        targetId = book.id
      } else {
        const course = await this.prisma.course.create({
          data: {
            name: payload.name,
            value: 'custom',
            description: payload.description,
            teacher: '我',
            url: '',
            price: 0,
            ownerId: job.userId,
            isCustom: true,
          },
        })
        await this.prisma.courseRecord.create({
          data: { userId: job.userId, courseId: course.id, isPurchased: true },
        })
        targetId = course.id
      }

      for (let index = 0; index < payload.rows.length; index += 1) {
        const row = payload.rows[index]
        try {
          const word = await this.prisma.wordBook.upsert({
            where: {
              ownerId_word: { ownerId: job.userId, word: row.word },
            },
            update: {
              phonetic: row.phonetic || undefined,
              translation: row.translation || undefined,
              definition: row.definition || undefined,
              pos: row.pos || undefined,
              example: row.example || undefined,
              tag: row.tags || undefined,
            },
            create: {
              word: row.word,
              phonetic: row.phonetic || null,
              translation: row.translation || null,
              definition: row.definition || null,
              pos: row.pos || null,
              example: row.example || null,
              tag: row.tags || null,
              ownerId: job.userId,
              source: 'custom',
            },
          })

          if (job.type === 'wordbook') {
            await this.prisma.userWordBookItem.upsert({
              where: { bookId_wordId: { bookId: targetId!, wordId: word.id } },
              update: { sortOrder: index },
              create: { bookId: targetId!, wordId: word.id, sortOrder: index },
            })
          } else {
            await this.prisma.courseWord.upsert({
              where: { courseId_wordId: { courseId: targetId!, wordId: word.id } },
              update: { sortOrder: index, unit: row.unit || null },
              create: {
                courseId: targetId!,
                wordId: word.id,
                sortOrder: row.sortOrder ?? index,
                unit: row.unit || null,
              },
            })
          }
          success += 1
        } catch (error) {
          errors.push({
            row: row.row,
            message: error instanceof Error ? error.message : '写入失败',
          })
        }

        if (index % 50 === 0 || index === payload.rows.length - 1) {
          await this.prisma.importJob.update({
            where: { id: jobId },
            data: { success, failed: job.total - success, errors: errors as unknown as Prisma.InputJsonValue },
          })
        }
      }

      if (job.type === 'wordbook') {
        await this.prisma.userWordBook.update({
          where: { id: targetId! },
          data: { wordCount: success },
        })
      } else {
        await this.prisma.course.update({
          where: { id: targetId! },
          data: { wordCount: success },
        })
      }

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'done',
          targetId,
          success,
          failed: job.total - success,
          errors: errors as unknown as Prisma.InputJsonValue,
          message: `成功导入 ${success} 条`,
        },
      })
    } catch (error) {
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          success,
          failed: job.total - success,
          errors: errors as unknown as Prisma.InputJsonValue,
          message: error instanceof Error ? error.message : '导入失败',
        },
      })
    }
  }

  private toJob(job: {
    id: string
    type: string
    status: string
    fileName: string
    targetId: string | null
    total: number
    success: number
    failed: number
    message: string | null
    errors: unknown
    createdAt: Date
    updatedAt: Date
  }): ImportJob {
    return {
      id: job.id,
      type: job.type as ImportTarget,
      status: job.status as ImportJob['status'],
      fileName: job.fileName,
      targetId: job.targetId,
      total: job.total,
      success: job.success,
      failed: job.failed,
      message: job.message,
      errors: (job.errors as ImportIssue[] | null) ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    }
  }

  private normalizeHeader(value: string) {
    return value.replace(/\s+/g, '').toLowerCase()
  }

  private assertType(type: string): asserts type is ImportTarget {
    if (type !== 'wordbook' && type !== 'course') {
      throw new BadRequestException('导入类型不支持')
    }
  }
}
