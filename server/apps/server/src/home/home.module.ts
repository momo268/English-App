import { Module } from '@nestjs/common';
import { LearnModule } from '../learn/learn.module';
import { StatsModule } from '../stats/stats.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [LearnModule, StatsModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
