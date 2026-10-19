import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { SharedModule } from '@libs/shared';
import { WorkBookModule } from './work-book/work-book.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [UserModule, SharedModule, WorkBookModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule { }
