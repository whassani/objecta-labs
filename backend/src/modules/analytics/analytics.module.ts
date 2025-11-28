import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MetricsService } from './metrics.service';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { DailyMetrics } from './entities/daily-metrics.entity';
import { AgentMetrics } from './entities/agent-metrics.entity';
import { ConversationMetrics } from '../conversations/entities/conversation-metrics.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Agent } from '../agents/entities/agent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalyticsEvent, 
      DailyMetrics, 
      AgentMetrics,
      ConversationMetrics,
      Conversation,
      Agent,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, MetricsService],
  exports: [AnalyticsService, MetricsService],
})
export class AnalyticsModule {}
