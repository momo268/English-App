import { Injectable } from '@nestjs/common';
import { PrismaService, ResponseService } from '@libs/shared';

@Injectable()
export class LearnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseService) { }

  // 读取单词列表
  async getWOrdList(id: string, userId: string) {
    // 1.如果没有购买过课程进入页面，非法请求
    const courseRecord = await this.prisma.courseRecord.findFirst({
      where: {
        userId: userId,
        courseId: id,
        isPurchased: true,
      },
      include: {
        course: true,
      }
    })
    if (!courseRecord) {
      return this.response.error('非法请求');
    }
    const courseType = courseRecord.course.value; // gk,zk等一些分类
    // 点击保存之后学习过的单词不能被查到
    const words = await this.prisma.wordBook.findMany({
      where: {
        [courseType]: true,
        // 掌握的单词不能被查到
        wordBookRecords: {
          none: {
            userId: userId
          }
        }
      },
      skip: 0,
      take: 10,
      orderBy: {
        frq: 'desc' // 排序-频率越高越靠前
      }
    })

    return this.response.success(words);
  }

  // 保存单词掌握情况
  async saveWordMaster(wordIds: string[], userId: string) {
    // 1.保存单词到wordBookRecord
    const wordBookRecords = wordIds.map(wordId => {
      return {
        wordId: wordId, // 单词id
        userId: userId, // 用户id
        isMaster: true // 是否掌握
      }
    })
    await this.prisma.wordBookRecord.createMany({
      data: wordBookRecords
    })
    // 2.更新用户学习单词的数量
    const user = await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        wordNumber: {
          increment: wordIds.length
        }
      }
    })
    return this.response.success({
      wordNumber: user.wordNumber // 用户学习单词数量
    });
  }
}
