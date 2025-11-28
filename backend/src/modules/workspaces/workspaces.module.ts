import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceInvitation } from './entities/workspace-invitation.entity';
import { WorkspaceActivity } from './entities/workspace-activity.entity';
import { WorkspaceMembersService } from './services/workspace-members.service';
import { WorkspaceAnalyticsService } from './services/workspace-analytics.service';
import { User } from '../auth/entities/user.entity';
import { Agent } from '../agents/entities/agent.entity';
import { WorkflowExecution } from '../workflows/entities/workflow-execution.entity';
import { Document } from '../knowledge-base/entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      WorkspaceMember,
      WorkspaceInvitation,
      WorkspaceActivity,
      User,
      Agent,
      WorkflowExecution,
      Document,
    ]),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceMembersService, WorkspaceAnalyticsService],
  exports: [WorkspacesService, WorkspaceMembersService, WorkspaceAnalyticsService],
})
export class WorkspacesModule {}
