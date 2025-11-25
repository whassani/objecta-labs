import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty()
  @IsString()
  agentId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  content: string;
}
