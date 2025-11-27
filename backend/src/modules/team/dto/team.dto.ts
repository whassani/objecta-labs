import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsEnum(TeamRole)
  role: TeamRole;

  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateMemberRoleDto {
  @IsEnum(TeamRole)
  role: TeamRole;
}

export class AcceptInvitationDto {
  @IsString()
  token: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  password: string;
}
