import { Injectable } from '@nestjs/common';
import { CreateWorkBookDto } from './dto/create-work-book.dto';
import { UpdateWorkBookDto } from './dto/update-work-book.dto';
import type { WordQuery } from "@en/common/word";
import { ResponseService, PrismaService } from "@libs/shared"
import type { Prisma } from '@libs/shared/generated/prisma/client';


@Injectable()
export class WorkBookService {
  constructor(
    private readonly response: ResponseService,
    private readonly prisma: PrismaService,
  ) { }

  private toBoolean(value: string | boolean): boolean | undefined {
    return value === 'true' ? true : undefined;
  }

  async findAll(query: WordQuery) {
    const { page = 1, pageSize = 12, word, ...rest } = query
    const tags = Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, this.toBoolean(value)]))
    const where: Prisma.WordBookWhereInput = {
      word: word ? { contains: word } : undefined,
      ...tags
    }
    const [total = 0, list = []] = await Promise.all([
      this.prisma.wordBook.count({ where }),
      this.prisma.wordBook.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
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
