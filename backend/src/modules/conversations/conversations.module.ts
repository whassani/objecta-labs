import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsController } from './conversations.controller';
import { ConversationsStreamController } from './conversations-stream.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsStreamService } from './conversations-stream.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { AgentsModule } from '../agents/agents.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    AgentsModule,
    KnowledgeBaseModule,
    ToolsModule,
  ],
  controllers: [ConversationsController, ConversationsStreamController],
  providers: [ConversationsService, ConversationsStreamService],
  exports: [ConversationsService, ConversationsStreamService],
})
export class ConversationsModule {}
