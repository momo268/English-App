import { Module } from '@nestjs/common'
import { CoachController } from './coach.controller'
import { CoachService } from './coach.service'
import { RagService } from './rag.service'

@Module({
  controllers: [CoachController],
  providers: [CoachService, RagService],
})
export class CoachModule {}
