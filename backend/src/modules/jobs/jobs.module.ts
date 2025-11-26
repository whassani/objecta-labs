import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsGateway } from './jobs.gateway';
import { Job } from './entities/job.entity';
import { DataConversionProcessor } from './processors/data-conversion.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'data-conversion' },
      { name: 'fine-tuning' },
      { name: 'workflow-execution' },
      { name: 'document-processing' },
    ),
    ConfigModule,
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobsGateway,
    DataConversionProcessor,
  ],
  exports: [JobsService, BullModule],
})
export class JobsModule {}
