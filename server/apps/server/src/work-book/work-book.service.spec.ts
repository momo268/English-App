import { BadRequestException } from '@nestjs/common';
import type { WordQuery } from '@en/common/word';
import { PrismaService, ResponseService } from '@libs/shared';
import { WorkBookService } from './work-book.service';

// 只测试查询参数和返回结果，不连接真实数据库。
jest.mock('@libs/shared', () => ({
  PrismaService: class {},
  ResponseService: class {},
}));

describe('WorkBookService', () => {
  const prisma = { wordBook: { count: jest.fn(), findMany: jest.fn() } };
  const response = { success: jest.fn((data) => data) };
  let service: WorkBookService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.wordBook.count.mockResolvedValue(1);
    prisma.wordBook.findMany.mockResolvedValue([{ id: 'word-1', word: 'style' }]);
    service = new WorkBookService(
      response as unknown as ResponseService,
      prisma as unknown as PrismaService,
    );
  });

  it('keeps valid pagination and trims search text', async () => {
    const result = await service.findAll({ page: 2, pageSize: 20, word: ' style ', gk: true });
    expect(prisma.wordBook.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 20, take: 20,
      where: expect.objectContaining({ word: { contains: 'style', mode: 'insensitive' }, gk: true }),
    }));
    expect(result).toEqual({ total: 1, list: [{ id: 'word-1', word: 'style' }] });
  });

  it('accepts URL strings while ignoring unsupported filters', async () => {
    const query = { page: '1', pageSize: '12', gk: 'true', zk: 'false', unknownTag: 'true' };
    await service.findAll(query as unknown as WordQuery);
    const where = prisma.wordBook.count.mock.calls[0][0].where;
    expect(where.gk).toBe(true);
    expect(where.zk).toBeUndefined();
    expect(where).not.toHaveProperty('unknownTag');
    expect(prisma.wordBook.findMany.mock.calls[0][0].where).toEqual(where);
  });

  it('uses the existing defaults when pagination is omitted', async () => {
    await service.findAll({} as WordQuery);
    expect(prisma.wordBook.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 12 }));
  });

  it.each([
    { page: 0, pageSize: 12 },
    { page: -1, pageSize: 12 },
    { page: 1.5, pageSize: 12 },
    { page: 'abc', pageSize: 12 },
    { page: 1, pageSize: 0 },
    { page: 1, pageSize: 101 },
    { page: Number.MAX_SAFE_INTEGER, pageSize: 100 },
  ])('rejects invalid pagination before querying: %j', async (query) => {
    await expect(service.findAll(query as WordQuery)).rejects.toThrow(BadRequestException);
    expect(prisma.wordBook.findMany).not.toHaveBeenCalled();
    expect(prisma.wordBook.count).not.toHaveBeenCalled();
  });

  it('rejects a repeated or structured search parameter', async () => {
    const query = { page: 1, pageSize: 12, word: ['style', 'learn'] };
    await expect(service.findAll(query as unknown as WordQuery)).rejects.toThrow(BadRequestException);
    expect(prisma.wordBook.findMany).not.toHaveBeenCalled();
  });
});
