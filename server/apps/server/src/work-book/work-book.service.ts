import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { WordQuery } from "@en/common/word";
import type { UpdateUserWordBookPayload } from '@en/common/word-book';
import { ResponseService, PrismaService } from "@libs/shared"
import type { Prisma } from '@libs/shared/generated/prisma/client';


@Injectable()
export class WorkBookService {
  constructor(
    private readonly response: ResponseService,
    private readonly prisma: PrismaService,
  ) { }

  private toBoolean(value: unknown): boolean | undefined {
    return value === true || value === 'true' ? true : undefined;
  }

  async findAll(query: WordQuery) {
    const page = Number(query.page ?? 1)
    const pageSize = Number(query.pageSize ?? 12)
    const skip = (page - 1) * pageSize
    if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
      !Number.isSafeInteger(skip)) {
      throw new BadRequestException('页码必须为正整数，每页数量须在 1 到 100 之间')
    }
    if (query.word != null && typeof query.word !== 'string') {
      throw new BadRequestException('搜索词必须是字符串')
    }
    const word = query.word?.trim()
    // 只接收页面支持的分类，不把任意 URL 参数直接传给数据库。
    const where: Prisma.WordBookWhereInput = {
      ownerId: null,
      word: word ? { contains: word, mode: 'insensitive' } : undefined,
      gk: this.toBoolean(query.gk),
      zk: this.toBoolean(query.zk),
      gre: this.toBoolean(query.gre),
      toefl: this.toBoolean(query.toefl),
      ielts: this.toBoolean(query.ielts),
      cet6: this.toBoolean(query.cet6),
      cet4: this.toBoolean(query.cet4),
      ky: this.toBoolean(query.ky),
    }
    const [total = 0, list = []] = await Promise.all([
      this.prisma.wordBook.count({ where }),
      this.prisma.wordBook.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          frq: 'desc',
        },
      }),
    ])
    return this.response.success({ total, list });
  }

  async findMyBooks(userId: string) {
    const list = await this.prisma.userWordBook.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
    return this.response.success({
      list: list.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total: list.length,
    })
  }

  async findMyBook(id: string, userId: string) {
    const book = await this.prisma.userWordBook.findFirst({
      where: { id, userId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: { word: true },
        },
      },
    })
    if (!book) throw new NotFoundException('词库不存在')
    return this.response.success({
      id: book.id,
      name: book.name,
      description: book.description,
      wordCount: book.wordCount,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      words: book.items.map((item) => item.word),
    })
  }

  async updateMyBook(id: string, userId: string, dto: UpdateUserWordBookPayload) {
    const book = await this.prisma.userWordBook.findFirst({ where: { id, userId } })
    if (!book) throw new NotFoundException('词库不存在')
    const name = dto.name?.trim()
    if (dto.name != null && !name) throw new BadRequestException('词库名称不能为空')
    const updated = await this.prisma.userWordBook.update({
      where: { id },
      data: {
        name: name || undefined,
        description: dto.description === undefined ? undefined : dto.description.trim() || null,
      },
    })
    return this.response.success({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  }

  async removeMyBook(id: string, userId: string) {
    const book = await this.prisma.userWordBook.findFirst({ where: { id, userId } })
    if (!book) throw new NotFoundException('词库不存在')
    await this.prisma.$transaction([
      this.prisma.userWordBookItem.deleteMany({ where: { bookId: id } }),
      this.prisma.userWordBook.delete({ where: { id } }),
    ])
    return this.response.success({ id })
  }

  findOne(id: number) {
    return `This action returns a #${id} workBook`;
  }

}
