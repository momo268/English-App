import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { SharedModule } from '@libs/shared'
import { DigestModule } from './digest/digest.module';
import { CoachModule } from './coach/coach.module';

@Module({
  imports: [SharedModule, DigestModule, CoachModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule { }
