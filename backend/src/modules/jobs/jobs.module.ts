import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsGateway } from './jobs.gateway';
import { Job } from './entities/job.entity';
import { DataConversionProcessor } from './processors/data-conversion.processor';
import { FineTuningProcessor } from './processors/fine-tuning.processor';
import { FineTuningJob } from '../fine-tuning/entities/fine-tuning-job.entity';
import { FineTunedModel } from '../fine-tuning/entities/fine-tuned-model.entity';
import { FineTuningEvent } from '../fine-tuning/entities/fine-tuning-event.entity';
import { FineTuningDataset } from '../fine-tuning/entities/fine-tuning-dataset.entity';
import { OpenAIFineTuningProvider } from '../fine-tuning/providers/openai.provider';
import { OllamaFineTuningProvider } from '../fine-tuning/providers/ollama.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      FineTuningJob,
      FineTunedModel,
      FineTuningEvent,
      FineTuningDataset,
    ]),
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
    FineTuningProcessor,
    OpenAIFineTuningProvider,
    OllamaFineTuningProvider,
  ],
  exports: [JobsService, BullModule],
})
export class JobsModule {}
