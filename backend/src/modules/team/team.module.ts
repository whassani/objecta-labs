import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { TeamInvitation } from './entities/team-invitation.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { User } from '../auth/entities/user.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamInvitation, ActivityLog, User]),
    EmailModule,
    AuthModule, // Import to access UserHelperService
  ],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
