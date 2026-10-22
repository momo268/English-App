import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from "../auth/auth.module";
import { BullModule } from '@nestjs/bullmq';
import { digestQueueName } from '@libs/shared';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    AuthModule,
    // 注册 DIGEST_QUEUE，保存用户设置时可以直接更新/删除该用户的定时任务
    BullModule.registerQueue({ name: digestQueueName.name }),
  ],
})
export class UserModule { }
