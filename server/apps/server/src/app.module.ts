import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { SharedModule } from '@libs/shared';
import { WorkBookModule } from './work-book/work-book.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { CourseModule } from './course/course.module';
import { PayModule } from './pay/pay.module';
import { SocketModule } from './socket/socket.module';
import { LearnModule } from './learn/learn.module';
import { StatsModule } from './stats/stats.module';
import { HomeModule } from './home/home.module';
import { ImportModule } from './import/import.module';
import { ReportModule } from './report/report.module';


@Module({
  imports: [UserModule, SharedModule, WorkBookModule, AuthModule, CourseModule, PayModule, SocketModule, LearnModule, StatsModule, HomeModule, ImportModule, ReportModule],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule { }
