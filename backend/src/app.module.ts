import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { AgentsModule } from './modules/agents/agents.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { ToolsModule } from './modules/tools/tools.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { FineTuningModule } from './modules/fine-tuning/fine-tuning.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { rateLimitConfig } from './config/rate-limit.config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot(rateLimitConfig),
    HealthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'agentforge',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development', // Disable in production
    }),
    AuthModule,
    OrganizationsModule,
    WorkspacesModule,
    AgentsModule,
    KnowledgeBaseModule,
    ToolsModule,
    ConversationsModule,
    WorkflowsModule,
    FineTuningModule,
    JobsModule,
  ],
})
export class AppModule {}
