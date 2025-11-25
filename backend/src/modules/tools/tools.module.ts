import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { ToolExecutorService } from './tool-executor.service';
import { Tool } from './entities/tool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tool])],
  controllers: [ToolsController],
  providers: [ToolsService, ToolExecutorService],
  exports: [ToolsService, ToolExecutorService],
})
export class ToolsModule {}
