import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { Agent } from './entities/agent.entity';
import { LLMService } from './llm.service';
import { FineTunedModel } from '../fine-tuning/entities/fine-tuned-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, FineTunedModel])],
  controllers: [AgentsController],
  providers: [AgentsService, LLMService],
  exports: [AgentsService, LLMService],
})
export class AgentsModule {}
