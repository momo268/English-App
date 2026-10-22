import { Queue } from 'bullmq'
import { digestQueueName } from './digest.queue'

export interface DigestSchedulerUser {
    id: string
    email: string | null
    isTimingTask: boolean
    timingTaskTime: string
}

// 每个用户一个调度器，id 固定，改时间时用同一个 id 覆盖即可
export const getDigestSchedulerId = (userId: string) => `digest:${userId}`

/**
 * 按用户注册/更新定时任务：
 * - 用户开启定时任务、邮箱和时间都合法 -> 注册一个每天 HH:mm 执行的 cron
 * - 否则 -> 删除这个用户的调度器
 */
export async function syncUserDigestScheduler(queue: Queue, user: DigestSchedulerUser) {
    const schedulerId = getDigestSchedulerId(user.id)
    const [hour, minute] = (user.timingTaskTime || '').split(':').map(Number)
    const validTime = Number.isInteger(hour) && Number.isInteger(minute) &&
        hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59

    if (!user.isTimingTask || !user.email || !validTime) {
        await queue.removeJobScheduler(schedulerId)
        return
    }

    await queue.upsertJobScheduler(
        schedulerId,
        {
            // 用户设置 8:00 -> "0 8 * * *"，由 cron 直接决定发送时间，不再需要 delay
            pattern: `${minute} ${hour} * * *`,
            tz: 'Asia/Shanghai',
        },
        {
            name: digestQueueName.task.emailDigest,
            data: { userId: user.id },
            opts: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                // 每天每用户只有一条任务，保留一天方便排查
                removeOnComplete: { age: 24 * 3600 },
                removeOnFail: { count: 100 },
            },
        },
    )
}
