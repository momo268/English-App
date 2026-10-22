import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { digestQueueName } from './digest.queue';
import { DigestService } from './digest.service';
import { EmailService } from '@libs/shared';
@Processor(digestQueueName.name)
export class DigestProcessor extends WorkerHost {
    constructor(private readonly digestService: DigestService, private readonly emailService: EmailService) {
        super();
    }
    async process(job: Job) {
        // 每个用户到自己的定时时间，才会产生这个任务
        if (job.name === digestQueueName.task.emailDigest) {
            const digest = await this.digestService.generateUserDigest(job.data.userId)
            // 昨天没有学习记录，或用户已经关闭定时任务/删除邮箱，直接跳过，不发邮件
            if (!digest) {
                return
            }
            const success = await this.emailService.sendEmail(digest.email, '每日单词记忆报告', digest.html)
            if (!success) {
                // 抛错让 BullMQ 按 attempts/backoff 重试，而不是静默丢邮件
                throw new Error(`邮件发送失败: ${digest.email}`)
            }
            console.log('邮件发送成功')
        }
    }

}
