import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService, syncUserDigestScheduler } from '@libs/shared'
import dayjs from 'dayjs'
import { createAgent } from 'langchain'
import { createDeepSeek } from '../llm/llm.config'
import { tool } from '@langchain/core/tools' //引入langchain的工具
import marked from 'marked'
import { Queue } from 'bullmq' //类型
import { digestQueueName } from './digest.queue'
import { InjectQueue } from '@nestjs/bullmq'
@Injectable()
export class DigestService implements OnModuleInit {
    constructor(
        private readonly prismaService: PrismaService,
        @InjectQueue(digestQueueName.name) private readonly digestQueue: Queue,
    ) { }

    //普通的大模型他只能输出文字，他没有办法进行比如查看代码 查看图片 或者是连接数据库
    //也就是说大模型会根据我们的tool里面的描述会自动选择要不要调用这个工具
    private queryTool() {
        return tool(async ({ userId }: { userId: string }) => {
            const user = await this.prismaService.user.findFirst({
                where: {
                    id: userId,
                },
                select: {
                    email: true, //邮箱
                    name: true, //用户名
                    wordNumber: true, //单词数量
                    //查询昨天的单词记录
                    wordBookRecords: {
                        where: {
                            createdAt: {
                                //昨天00:00:00 - 今天00:00:00
                                gte: dayjs().subtract(1, 'day').startOf('day').toDate(),
                                lt: dayjs().startOf('day').toDate()
                            }
                        },
                        select: {
                            //找到那个表
                            word: {
                                select: {
                                    //找到那个单词
                                    word: true,
                                }
                            }
                        }
                    }
                }
            })
            return user
        }, {
            name: 'queryTool', //名字一定要语义化 唯一不能重复
            description: '根据用户id查询用户学习的单词记录', //他会通过desc 和 name 选择要不要调用这个工具
            //JSON Schema 是用来描述数据结构的，他可以用来验证数据是否符合要求
            //给大模型看的 {userId: '1234567890'}
            schema: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: '用户id' },
                },
                required: ['userId']
            }
        })
    }

    async onModuleInit() {
        // 旧版本注册的“每天 0 点执行”的调度器，已经被“按用户注册”替代，启动时清理掉
        try {
            await this.digestQueue.removeJobScheduler(digestQueueName.task.everyDayDigest)
        } catch (error) {
            console.error('清理旧的每日调度任务失败', error)
        }
        // 按用户注册定时任务：每个用户一个 cron，cron 的时间就是用户设置的 HH:mm
        try {
            const users = await this.prismaService.user.findMany({
                select: { id: true, email: true, isTimingTask: true, timingTaskTime: true },
            })
            for (const user of users) {
                try {
                    await syncUserDigestScheduler(this.digestQueue, user)
                } catch (error) {
                    console.error(`同步用户 ${user.id} 的定时任务失败`, error)
                }
            }
        } catch (error) {
            // 数据库暂时不可用时不要让整个 AI 服务起不来，用户保存设置时还会再同步
            console.error('批量同步用户定时任务失败', error)
        }
    }

    // 到点后执行：查昨天记录 -> 生成日报 -> 返回收件人和 html（昨天没学习返回 null）
    async generateUserDigest(userId: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, isTimingTask: true, timingTaskTime: true },
        })
        // 用户可能已经关闭定时任务/删除邮箱，任务到点后直接跳过
        if (!user || !user.isTimingTask || !user.email || !user.timingTaskTime) {
            return null
        }

        // 只统计昨天的记录；昨天没学习就不发
        const yesterdayStart = dayjs().subtract(1, 'day').startOf('day').toDate()
        const todayStart = dayjs().startOf('day').toDate()
        const recordCount = await this.prismaService.wordBookRecord.count({
            where: {
                userId,
                createdAt: { gte: yesterdayStart, lt: todayStart },
            },
        })
        if (recordCount === 0) {
            return null
        }

        const agent = createAgent({
            model: createDeepSeek(),
            tools: [this.queryTool()],
            systemPrompt: '你是一个单词记忆助手，根据用户信息和昨天的单词记录，生成单词记忆报告',
        })
        const result = await agent.invoke({
            messages: [{ role: 'user', content: `查询用户信息,并且根据用户id关联单词记录表，查询出用户昨天的单词记录,用户id: ${user.id}，过滤掉敏感信息` }]
        })
        const content = result.messages.at(-1)?.content
        if (!content) {
            return null
        }
        const html = await marked.parse(content as string)
        return { email: user.email, html }
    }
}
