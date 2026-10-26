import { BadRequestException, Injectable } from '@nestjs/common';
import type { WordQuery } from "@en/common/word";
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
      word: word ? { contains: word } : undefined,
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

  findOne(id: number) {
    return `This action returns a #${id} workBook`;
  }

}
