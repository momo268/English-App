import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, ResponseService } from '@libs/shared';
import { TradeStatus } from '@libs/shared/generated/prisma/enums';
import type { UpdateUserCoursePayload } from '@en/common/course';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService, private readonly response: ResponseService) { }

  async findAll(userId?: string) {
    let purchasedCourseIds: string[] = [];
    if (userId) {
      const records = await this.prisma.courseRecord.findMany({
        where: {
          userId,
          OR: [
            { isPurchased: true },
            { course: { price: 0 } },
            { paymentRecord: { tradeStatus: TradeStatus.TRADE_SUCCESS } },
          ],
        },
        select: { courseId: true },
      });
      purchasedCourseIds = records.map(item => item.courseId);
    }
    const courses = await this.prisma.course.findMany({
      where: {
        isCustom: false,
        ownerId: null,
        ...(purchasedCourseIds.length ? { id: { notIn: purchasedCourseIds } } : {}),
      },
    });
    const list = courses.map(item => ({
      ...item,
      price: Number(item.price).toFixed(2)
    }));
    return this.response.success(list);
  }

  async findMy(userId: string) {
    const courseRecords = await this.prisma.courseRecord.findMany({
      where: {
        userId,
        OR: [
          // 自定义课程导入后直接可用，不依赖支付记录
          { course: { ownerId: userId, isCustom: true } },
          // 已标记购买的课程（兼容历史数据没有支付关联的情况）
          { isPurchased: true },
          // 免费系统课程
          { course: { price: 0 } },
          // 已支付课程
          { paymentRecord: { tradeStatus: TradeStatus.TRADE_SUCCESS } },
        ],
      },
      include: {
        course: true
      }
    });
    const list = courseRecords.map(item => ({
      ...item.course,
      price: Number(item.course.price).toFixed(2)
    }));
    return this.response.success(list);
  }

  async updateMyCourse(id: string, userId: string, dto: UpdateUserCoursePayload) {
    const course = await this.prisma.course.findFirst({
      where: { id, ownerId: userId, isCustom: true },
    });
    if (!course) throw new NotFoundException('课程不存在');
    const name = dto.name?.trim();
    if (dto.name != null && !name) throw new BadRequestException('课程名称不能为空');
    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        name: name || undefined,
        description: dto.description === undefined ? undefined : dto.description.trim(),
      },
    });
    return this.response.success({ ...updated, price: Number(updated.price).toFixed(2) });
  }

  async removeMyCourse(id: string, userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, ownerId: userId, isCustom: true },
    });
    if (!course) throw new NotFoundException('课程不存在');
    await this.prisma.$transaction([
      this.prisma.courseWord.deleteMany({ where: { courseId: id } }),
      this.prisma.courseRecord.deleteMany({ where: { courseId: id } }),
      this.prisma.course.delete({ where: { id } }),
    ]);
    return this.response.success({ id });
  }
}
