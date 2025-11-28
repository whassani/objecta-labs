import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['admin', 'member', 'viewer'], default: 'member' })
  @IsOptional()
  @IsIn(['admin', 'member', 'viewer'])
  role?: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['owner', 'admin', 'member', 'viewer'] })
  @IsIn(['owner', 'admin', 'member', 'viewer'])
  role: string;
}

export class AcceptInvitationDto {
  @ApiProperty()
  @IsString()
  token: string;
}
